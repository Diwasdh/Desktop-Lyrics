using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Threading;
using Windows.Media.Control;

namespace UniversalLyrics.Bridge
{
    class Program
    {
        private static Dispatcher _dispatcher;
        private static GlobalSystemMediaTransportControlsSessionManager _manager;
        private static GlobalSystemMediaTransportControlsSession _currentSession;
        private static DispatcherTimer _pollTimer;
        private static string _lastTrackKey = "";
        private static double _lastReportedPosition = -1;
        private static string _lastPlaybackStatus = "";

        [STAThread]
        static void Main(string[] args)
        {
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                try { EmitLog("Unhandled Exception: " + e.ExceptionObject); } catch {}
            };

            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            _dispatcher = Dispatcher.CurrentDispatcher;

            // Background thread for stdin commands
            var cmdThread = new Thread(ReadCommands) { IsBackground = true };
            cmdThread.Start();

            // Initialize WinRT Session Manager on STA thread
            _dispatcher.InvokeAsync(async () =>
            {
                await InitManagerAsync();
            });

            // Run STA message loop
            Dispatcher.Run();
        }

        static async Task InitManagerAsync()
        {
            try
            {
                _manager = await System.WindowsRuntimeSystemExtensions.AsTask(
                    GlobalSystemMediaTransportControlsSessionManager.RequestAsync()
                );

                EmitLog("GSMTC Manager connected on STA dispatcher.");

                // Periodic check timer on STA dispatcher (every 200ms)
                _pollTimer = new DispatcherTimer(DispatcherPriority.Normal, _dispatcher);
                _pollTimer.Interval = TimeSpan.FromMilliseconds(200);
                _pollTimer.Tick += async (s, e) =>
                {
                    await CheckSessionStateAsync();
                };
                _pollTimer.Start();

                await CheckSessionStateAsync();
            }
            catch (Exception ex)
            {
                EmitLog("Initialization error: " + ex.Message);
            }
        }

        static async Task CheckSessionStateAsync()
        {
            if (_manager == null) return;

            try
            {
                var session = _manager.GetCurrentSession();
                if (session == null)
                {
                    // Fallback to any active playing session
                    var all = _manager.GetSessions();
                    foreach (var s in all)
                    {
                        var info = s.GetPlaybackInfo();
                        if (info != null && info.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing)
                        {
                            session = s;
                            break;
                        }
                    }
                }

                if (session == null)
                {
                    if (!string.IsNullOrEmpty(_lastTrackKey))
                    {
                        _currentSession = null;
                        _lastTrackKey = "";
                        EmitJson("no_media", "{}");
                    }
                    return;
                }

                _currentSession = session;

                var mediaProps = await System.WindowsRuntimeSystemExtensions.AsTask(
                    session.TryGetMediaPropertiesAsync()
                );

                var timeline = session.GetTimelineProperties();
                var playback = session.GetPlaybackInfo();

                string title = mediaProps != null && !string.IsNullOrEmpty(mediaProps.Title) ? mediaProps.Title : "";
                string artist = mediaProps != null && !string.IsNullOrEmpty(mediaProps.Artist) ? mediaProps.Artist : "";
                string album = mediaProps != null && !string.IsNullOrEmpty(mediaProps.AlbumTitle) ? mediaProps.AlbumTitle : "";
                string app = session.SourceAppUserModelId ?? "Unknown";

                string status = playback != null ? playback.PlaybackStatus.ToString() : "Stopped";

                // High-precision live position calculation
                double posMs = 0;
                double durMs = timeline != null ? timeline.EndTime.TotalMilliseconds : 0;
                if (timeline != null)
                {
                    posMs = timeline.Position.TotalMilliseconds;
                    if (playback != null && playback.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing)
                    {
                        var elapsed = (DateTimeOffset.UtcNow - timeline.LastUpdatedTime).TotalMilliseconds;
                        if (elapsed > 0 && elapsed < 86400000)
                        {
                            posMs += elapsed;
                        }
                    }
                    if (durMs > 0 && posMs > durMs)
                    {
                        posMs = durMs;
                    }
                }

                string trackKey = app + "|" + title + "|" + artist + "|" + durMs.ToString("0");

                if (trackKey != _lastTrackKey)
                {
                    _lastTrackKey = trackKey;
                    _lastReportedPosition = posMs;
                    _lastPlaybackStatus = status;

                    // Extract thumbnail
                    string thumbnailBase64 = "";
                    if (mediaProps != null && mediaProps.Thumbnail != null)
                    {
                        try
                        {
                            var thumbStreamRef = await System.WindowsRuntimeSystemExtensions.AsTask(
                                mediaProps.Thumbnail.OpenReadAsync()
                            );
                            if (thumbStreamRef != null && thumbStreamRef.Size > 0)
                            {
                                var netStream = System.IO.WindowsRuntimeStreamExtensions.AsStreamForRead(thumbStreamRef);
                                using (var ms = new MemoryStream())
                                {
                                    netStream.CopyTo(ms);
                                    byte[] bytes = ms.ToArray();
                                    if (bytes.Length > 0)
                                    {
                                        thumbnailBase64 = "data:image/jpeg;base64," + Convert.ToBase64String(bytes);
                                    }
                                }
                            }
                        }
                        catch
                        {
                            // Ignore thumbnail failure
                        }
                    }

                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.Append("\"app\":" + EscapeJson(app) + ",");
                    sb.Append("\"title\":" + EscapeJson(title) + ",");
                    sb.Append("\"artist\":" + EscapeJson(artist) + ",");
                    sb.Append("\"album\":" + EscapeJson(album) + ",");
                    sb.Append("\"status\":" + EscapeJson(status) + ",");
                    sb.Append("\"positionMs\":" + posMs.ToString("0") + ",");
                    sb.Append("\"durationMs\":" + durMs.ToString("0") + ",");
                    sb.Append("\"thumbnail\":" + EscapeJson(thumbnailBase64));
                    sb.Append("}");

                    EmitJson("track_change", sb.ToString());
                }
                else
                {
                    bool statusChanged = status != _lastPlaybackStatus;
                    bool posMoved = Math.Abs(posMs - _lastReportedPosition) >= 150;

                    if (statusChanged || posMoved)
                    {
                        _lastReportedPosition = posMs;
                        _lastPlaybackStatus = status;

                        var sb = new StringBuilder();
                        sb.Append("{");
                        sb.Append("\"status\":" + EscapeJson(status) + ",");
                        sb.Append("\"positionMs\":" + posMs.ToString("0") + ",");
                        sb.Append("\"durationMs\":" + durMs.ToString("0"));
                        sb.Append("}");

                        EmitJson("timeline_tick", sb.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                EmitLog("Check session error: " + ex.Message);
            }
        }

        static void ReadCommands()
        {
            try
            {
                string line;
                while ((line = Console.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (line == "exit" || line == "quit")
                    {
                        _dispatcher.Invoke(() =>
                        {
                            _dispatcher.InvokeShutdown();
                        });
                        break;
                    }

                    string cmd = line.ToLowerInvariant();
                    _dispatcher.InvokeAsync(async () =>
                    {
                        if (_currentSession == null) return;
                        try
                        {
                            if (cmd == "play")
                            {
                                await System.WindowsRuntimeSystemExtensions.AsTask(_currentSession.TryPlayAsync());
                            }
                            else if (cmd == "pause")
                            {
                                await System.WindowsRuntimeSystemExtensions.AsTask(_currentSession.TryPauseAsync());
                            }
                            else if (cmd == "toggle")
                            {
                                await System.WindowsRuntimeSystemExtensions.AsTask(_currentSession.TryTogglePlayPauseAsync());
                            }
                            else if (cmd == "next")
                            {
                                await System.WindowsRuntimeSystemExtensions.AsTask(_currentSession.TrySkipNextAsync());
                            }
                            else if (cmd == "previous")
                            {
                                await System.WindowsRuntimeSystemExtensions.AsTask(_currentSession.TrySkipPreviousAsync());
                            }
                        }
                        catch (Exception ex)
                        {
                            EmitLog("Command dispatch error: " + ex.Message);
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                EmitLog("ReadCommands thread exit: " + ex.Message);
            }
        }

        static string EscapeJson(string s)
        {
            if (s == null) return "null";
            var sb = new StringBuilder();
            sb.Append("\"");
            foreach (char c in s)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '\"': sb.Append("\\\""); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    default:
                        if (c < 32)
                        {
                            sb.AppendFormat("\\u{0:X4}", (int)c);
                        }
                        else
                        {
                            sb.Append(c);
                        }
                        break;
                }
            }
            sb.Append("\"");
            return sb.ToString();
        }

        static void EmitJson(string type, string rawJsonData)
        {
            Console.WriteLine("{\"type\":\"" + type + "\",\"data\":" + rawJsonData + "}");
        }

        static void EmitLog(string message)
        {
            Console.WriteLine("{\"type\":\"log\",\"message\":" + EscapeJson(message) + "}");
        }
    }
}
