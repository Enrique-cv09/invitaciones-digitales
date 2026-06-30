import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../config/supabaseClient";

interface Integrante {
  id: number;
  nombre: string;
  asistio: boolean;
  confirmado_individual: boolean;
  hora_ingreso?: string;
}

interface HostessProps {
  onRegistrarIngreso: (idsAIngresar: number[]) => void;
}

export default function Hostess({ onRegistrarIngreso }: HostessProps) {
  // 🔐 ESTADOS DE AUTENTICACIÓN (SUPABASE AUTH)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sesion, setSesion] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // 🎟️ ESTADOS DEL COMPONENTE ORIGINAL
  const [familiaActual, setFamiliaActual] = useState<any>(null);
  const [integrantesActuales, setIntegrantesActuales] = useState<Integrante[]>(
    [],
  );
  const [modoEscaneo, setModoEscaneo] = useState(true);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // 🔄 1. Escuchar la sesión real en el servidor de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🍞 Efecto para desvanecer el Toast automáticamente después de 3 segundos
  useEffect(() => {
    if (toastMensaje) {
      const timer = setTimeout(() => {
        setToastMensaje(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMensaje]);

  // 📷 Lógica del Escáner QR
  useEffect(() => {
    if (!modoEscaneo || !sesion) return;

    const scanner = new Html5QrcodeScanner(
      "lector-qr-container",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0],
      },
      false,
    );

    const alEscanearExito = async (textoDecodificado: string) => {
      try {
        scanner.clear();
        setLoadingBusqueda(true);
        setModoEscaneo(false);

        const urlProcesada = new URL(textoDecodificado);
        const idFamilia = urlProcesada.searchParams.get("id");

        if (!idFamilia) {
          setToastMensaje("❌ Código QR no válido");
          setFamiliaActual(null);
          setIntegrantesActuales([]);
          setModoEscaneo(true);
          setLoadingBusqueda(false);
          return;
        }

        const { data: dataFamilia } = await supabase
          .from("familias")
          .select("*")
          .eq("id", idFamilia)
          .maybeSingle();

        // 🟢 CORRECCIÓN QUIRÚRGICA: Regresamos a "familia_id" que es el campo real en tu DB
        const { data: dataIntegrantes } = await supabase
          .from("integrantes")
          .select("*")
          .eq("familia_id", idFamilia)
          .order("id", { ascending: true });

        if (dataFamilia) {
          let nombreMesaFinal = "Sin Asignar";
          if (dataFamilia.mesa_id) {
            const { data: dataMesa } = await supabase
              .from("mesas")
              .select("nombre_mesa")
              .eq("id", dataFamilia.mesa_id)
              .maybeSingle();

            if (dataMesa) {
              nombreMesaFinal = dataMesa.nombre_mesa;
            }
          }

          setFamiliaActual({
            ...dataFamilia,
            mesas: { nombre_mesa: nombreMesaFinal },
          });

          setIntegrantesActuales(dataIntegrantes || []);
        } else {
          setToastMensaje("❌ No se encontró el registro");
          setFamiliaActual(null);
          setIntegrantesActuales([]);
          setModoEscaneo(true);
        }
      } catch (err) {
        console.error(err);
        setToastMensaje("❌ Error al leer el código");
        setFamiliaActual(null);
        setIntegrantesActuales([]);
        setModoEscaneo(true);
      } finally {
        setLoadingBusqueda(false);
      }
    };

    scanner.render(alEscanearExito, () => {});

    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Error limpiando scanner", error));
    };
  }, [modoEscaneo, sesion]);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAuth(null);
    setLoadingBusqueda(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorAuth("⚠️ Credenciales incorrectas para el Staff.");
    }
    setLoadingBusqueda(false);
  };

  const cerrarSesion = async () => {
    // 🛡️ Alerta de confirmación para evitar dedazos accidentales
    const confirmar = window.confirm(
      "¿Estás segura de que deseas cerrar sesión como Staff?",
    );

    if (confirmar) {
      await supabase.auth.signOut();
      setFamiliaActual(null);
      setIntegrantesActuales([]);
      setModoEscaneo(true);
    }
  };

  const manejarCheckbox = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const ejecutarCheckIn = async () => {
    await onRegistrarIngreso(seleccionados);

    const ahora = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setIntegrantesActuales((prev) =>
      prev.map((int) =>
        seleccionados.includes(int.id)
          ? { ...int, asistio: true, hora_ingreso: ahora }
          : int,
      ),
    );

    setToastMensaje(
      `¡Acceso Concedido! Bienvenidos Familia ${familiaActual?.nombre_familia}`,
    );
    setSeleccionados([]);
  };

  const confirmados = integrantesActuales.filter(
    (i) => i.confirmado_individual,
  );

  if (loadingAuth) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#fdfbfe",
        }}
      >
        <div className="spinner-gala" />
      </div>
    );
  }

  // ================= 🛡️ RENDER A: BARRERA DE SEGURIDAD (LOGIN FORM) =================
  if (!sesion) {
    return (
      <div
        className="invitacion-container"
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          className="tarjeta-gala"
          style={{
            maxWidth: "360px",
            width: "100%",
            padding: "35px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{ fontSize: "36px", marginBottom: "10px", display: "block" }}
          >
            🔐
          </span>
          <h2
            className="titulo-gala"
            style={{ fontSize: "26px", margin: "0 0 10px 0" }}
          >
            Acceso Staff
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "#6d6d72",
              marginBottom: "25px",
              fontFamily: "'Montserrat', sans-serif",
              lineHeight: "1.5",
            }}
          >
            Sección exclusiva para la Hostess del salón. Por favor introduce las
            credenciales oficiales.
          </p>

          <form onSubmit={manejarLogin} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#3b1b54",
                  fontWeight: "600",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e1bee7",
                  marginTop: "5px",
                  boxSizing: "border-box",
                }}
                placeholder="hostess@salongoldrain.com"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  color: "#3b1b54",
                  fontWeight: "600",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e1bee7",
                  marginTop: "5px",
                  boxSizing: "border-box",
                }}
                placeholder="••••••••"
              />
            </div>

            {errorAuth && (
              <p
                style={{
                  color: "#cf6679",
                  fontSize: "12px",
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                {errorAuth}
              </p>
            )}

            <button
              type="submit"
              className="btn-oscuro"
              style={{ width: "100%", padding: "12px" }}
            >
              🔓 Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= RENDER B: PANEL AUTORIZADO DE LA HOSTESS =================
  return (
    <div
      className="invitacion-container"
      style={{ minHeight: "100vh", padding: "40px 20px" }}
    >
      {/* 🍞 RENDER DEL TOAST NOTIFICATION PREMIUM */}
      {toastMensaje && (
        <div className="toast-gala">
          {toastMensaje}
          <div className="toast-progress" />
        </div>
      )}

      <div
        className="tarjeta-gala"
        style={{ maxWidth: "420px", margin: "0 auto", padding: "30px 20px" }}
      >
        {/* ================= PANTALLA A: MODO ESCANEO ================= */}
        {modoEscaneo && (
          <div style={{ textAlign: "center" }}>
            <span className="subtitulo-caps">Acceso en Puerta</span>
            <h2
              className="titulo-gala"
              style={{ fontSize: "32px", margin: "10px 0 20px 0" }}
            >
              Escáner QR
            </h2>

            <div
              id="lector-qr-container"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #e3d3e6",
              }}
            ></div>

            <p
              style={{
                fontSize: "12px",
                color: "#8e8e93",
                marginTop: "20px",
                fontFamily: "'Montserrat', sans-serif",
                lineHeight: "1.5",
              }}
            >
              Coloca el código QR del pase digital frente a la cámara para
              cargar la lista de gala de forma inmediata.
            </p>

            <button
              onClick={() => {
                setModoEscaneo(false);
                setTimeout(() => setModoEscaneo(true), 300);
              }}
              style={{
                marginTop: "15px",
                background: "none",
                border: "none",
                color: "#7b1fa2",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif",
                display: "block",
                width: "100%",
              }}
            >
              📷 ¿La cámara no lee? Reestablecer escáner
            </button>

            {/* 🚪 NUEVA UBICACIÓN DE SALIR (MANTENIENDO LA SIMETRÍA) */}
            <button
              onClick={cerrarSesion}
              style={{
                marginTop: "30px",
                background: "none",
                border: "1px solid #eae1eb",
                color: "#8e8e93",
                borderRadius: "8px",
                padding: "10px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "'Montserrat', sans-serif",
                width: "100%",
              }}
            >
              🚪 Cerrar Sesión de Staff
            </button>
          </div>
        )}

        {/* ================= 💀 RENDER DEL SKELETON LOADING (SHIMMER) ================= */}
        {loadingBusqueda && (
          <div className="skeleton-container">
            <div
              className="skeleton-block"
              style={{ height: "14px", width: "40%", margin: "0 auto" }}
            ></div>
            <div
              className="skeleton-block"
              style={{ height: "35px", width: "60%", margin: "10px auto" }}
            ></div>
            <div
              className="skeleton-block"
              style={{
                height: "20px",
                width: "50%",
                margin: "0 auto 15px auto",
              }}
            ></div>
            <div
              className="skeleton-block"
              style={{
                height: "70px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            ></div>
            <div
              className="skeleton-block"
              style={{ height: "45px", borderRadius: "12px" }}
            ></div>
            <div
              className="skeleton-block"
              style={{ height: "45px", borderRadius: "12px" }}
            ></div>
          </div>
        )}

        {/* ================= PANTALLA B: MODAL DE GESTIÓN DE ACCESO ================= */}
        {!modoEscaneo && !loadingBusqueda && familiaActual && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <span className="subtitulo-caps" style={{ fontSize: "11px" }}>
                Pase Detectado con Éxito
              </span>
              <h2
                className="titulo-gala"
                style={{ fontSize: "32px", margin: "10px 0 5px 0" }}
              >
                Recepción
              </h2>
              <p
                className="nombre-gala"
                style={{ fontSize: "18px", color: "#4a148c" }}
              >
                Familia {familiaActual.nombre_familia}
              </p>
              <div
                style={{
                  width: "50px",
                  height: "1px",
                  background: "#eae1eb",
                  margin: "15px auto 0 auto",
                }}
              ></div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #fdfbfe 0%, #f3e5f5 100%)",
                border: "1px solid #e1bee7",
                padding: "15px",
                borderRadius: "12px",
                textAlign: "center",
                margin: "0 0 25px 0",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  display: "block",
                  letterSpacing: "1px",
                  color: "#8e8e93",
                  fontWeight: "600",
                }}
              >
                Ubicación del Banquete
              </span>
              <h1
                style={{
                  margin: "5px 0 0 0",
                  fontFamily: "'Playfair Display', serif",
                  color: "#4a148c",
                  fontSize: "28px",
                  fontWeight: "500",
                }}
              >
                {familiaActual.mesas?.nombre_mesa || "Sin Asignar"}
              </h1>
            </div>

            <div style={{ textAlign: "left" }}>
              <h3
                className="texto-cursiva"
                style={{
                  fontSize: "18px",
                  marginBottom: "15px",
                  color: "#3a3a3a",
                  display: "block",
                }}
              >
                Confirmados para ingreso:
              </h3>

              {confirmados.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#8e8e93",
                    fontSize: "14px",
                    margin: "20px 0",
                  }}
                >
                  No hay miembros confirmados para esta familia.
                </p>
              ) : (
                confirmados.map((persona) => {
                  const yaIngreso = persona.asistio;
                  return (
                    <div
                      key={persona.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                        padding: "12px",
                        background: yaIngreso ? "#f3e5f5" : "#ffffff",
                        borderRadius: "12px",
                        border: yaIngreso
                          ? "1px dashed #b39dbf"
                          : "1px solid #eae1eb",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexGrow: 1,
                          cursor: yaIngreso ? "not-allowed" : "pointer",
                          color: yaIngreso ? "#7b1fa2" : "#333",
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={yaIngreso}
                          checked={
                            yaIngreso || seleccionados.includes(persona.id)
                          }
                          onChange={() => manejarCheckbox(persona.id)}
                          style={{
                            marginRight: "12px",
                            transform: "scale(1.2)",
                            accentColor: "#2e7d32", // 🟢 Verde nítido
                          }}
                        />
                        <div>
                          <strong
                            style={{ fontWeight: yaIngreso ? "500" : "600" }}
                          >
                            {persona.nombre}
                          </strong>
                          {yaIngreso && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#7b1fa2",
                                marginTop: "2px",
                                fontStyle: "italic",
                              }}
                            >
                              ✓ Acceso Correcto • {persona.hora_ingreso}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })
              )}

              <button
                onClick={ejecutarCheckIn}
                disabled={seleccionados.length === 0}
                className="btn-oscuro"
                style={{
                  marginTop: "20px",
                  width: "100%",
                  opacity: seleccionados.length === 0 ? 0.4 : 1,
                  cursor:
                    seleccionados.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Registrar Entrada{" "}
                {seleccionados.length > 0 && `(${seleccionados.length})`}
              </button>

              <button
                onClick={() => {
                  setFamiliaActual(null);
                  setIntegrantesActuales([]);
                  setModoEscaneo(true);
                }}
                className="btn-mapa-iglesia"
                style={{
                  marginTop: "12px",
                  width: "100%",
                  textAlign: "center",
                  display: "block",
                }}
              >
                📷 Siguiente Invitado (Escanear otro)
              </button>

              {/* 🚪 CERRAR SESIÓN TAMBIÉN DISPONIBLE DESDE LA VISTA DE LA FAMILIA */}
              <button
                onClick={cerrarSesion}
                style={{
                  marginTop: "20px",
                  background: "none",
                  border: "none",
                  color: "#8e8e93",
                  fontSize: "11px",
                  fontWeight: "500",
                  fontFamily: "'Montserrat', sans-serif",
                  width: "100%",
                  textAlign: "center",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Cerrar Sesión de Staff
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
