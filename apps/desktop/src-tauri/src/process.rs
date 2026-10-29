//! Helpers for starting child processes (java, gradlew) quietly and stopping
//! them with everything they started.

use std::process::Command;

/// Windows: don't flash a console window for child processes.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// A `std` command that never pops up a console window.
pub fn quiet_command(program: impl AsRef<std::ffi::OsStr>) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// A `tokio` command that never pops up a console window and gets its own
/// process group (so it can be stopped together with its children).
pub fn quiet_async_command(program: impl AsRef<std::ffi::OsStr>) -> tokio::process::Command {
    let mut cmd = tokio::process::Command::new(program);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    #[cfg(unix)]
    cmd.process_group(0);
    cmd
}

/// Stops a process and every process it started (Gradle starts Java, which starts the game).
pub fn kill_tree(pid: u32) {
    #[cfg(windows)]
    {
        let _ = quiet_command("taskkill").args(["/T", "/F", "/PID", &pid.to_string()]).status();
    }
    #[cfg(unix)]
    {
        // A negative pid targets the whole process group created in quiet_async_command.
        let _ = Command::new("kill").args(["-TERM", &format!("-{pid}")]).status();
    }
}
