// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // TRIPLE ESCUDO DE COMPATIBILIDAD PARA LINUX
        // 1. Forzar X11 para evitar errores de EGL en Wayland+NVIDIA
        std::env::set_var("GDK_BACKEND", "x11");
        // 2. Desactivar DMABUF (Causa del EGL_BAD_PARAMETER)
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        // 3. Forzar modo de renderizado estable
        std::env::set_var("WEBKIT_USE_GL", "gles");
        
        eprintln!("[RUST-INIT] Linux stability shields engaged.");
    }

    lagfm_lib::run()
}
