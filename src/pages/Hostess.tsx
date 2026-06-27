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
  const [familiaActual, setFamiliaActual] = useState<any>(null);
  const [integrantesActuales, setIntegrantesActuales] = useState<Integrante[]>(
    [],
  );
  const [modoEscaneo, setModoEscaneo] = useState(true);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);

  // 🍞 Estado para la notificación flotante
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Efecto para desvanecer el Toast automáticamente después de 3 segundos
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
    if (!modoEscaneo) return;

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
        setLoadingBusqueda(true); // 👈 Aquí se dispara el Skeleton Loading
        setModoEscaneo(false);

        const urlProcesada = new URL(textoDecodificado);
        const idFamilia = urlProcesada.searchParams.get("id");

        if (!idFamilia) {
          setToastMensaje("❌ Código QR no válido");
          setModoEscaneo(true);
          setLoadingBusqueda(false);
          return;
        }

        // 1. Consultamos la familia y traemos los datos planos
        const { data: dataFamilia } = await supabase
          .from("familias")
          .select("*")
          .eq("id", idFamilia)
          .maybeSingle();

        // 2. CORRECCIÓN DEL FILTRO: Usamos "familia_id" que es el campo real en la DB
        const { data: dataIntegrantes } = await supabase
          .from("integrantes")
          .select("*")
          .eq("familia_id", idFamilia) // 👈 ¡Arreglado aquí!
          .order("id", { ascending: true });

        if (dataFamilia) {
          // Opcional: Si necesitas el nombre de la mesa, hacemos un fetch rápido para no errar con el join
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

          // Estructuramos el objeto idéntico a como lo espera tu vista
          setFamiliaActual({
            ...dataFamilia,
            mesas: { nombre_mesa: nombreMesaFinal },
          });

          setIntegrantesActuales(dataIntegrantes || []);
        } else {
          setToastMensaje("❌ No se encontró el registro");
          setModoEscaneo(true);
        }
      } catch (err) {
        console.error(err);
        setToastMensaje("❌ Error al leer el código");
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
  }, [modoEscaneo]);

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

    // 🍞 DETONAR TOAST PREMIUM EN LUGAR DE UN ALERT FEO
    setToastMensaje(
      `¡Acceso Concedido! Bienvenidos Familia ${familiaActual?.nombre_familia}`,
    );
    setSeleccionados([]);
  };

  const confirmados = integrantesActuales.filter(
    (i) => i.confirmado_individual,
  );

  return (
    <div
      className="invitacion-container"
      style={{ minHeight: "100vh", padding: "40px 20px" }}
    >
      {/* 🍞 RENDER DEL TOAST NOTIFICATION */}
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
          </div>
        )}

        {/* ================= 💀 RENDER DEL SKELETON LOADING (SHIMMER) ================= */}
        {loadingBusqueda && (
          <div className="skeleton-container">
            {/* Esqueleto del Header */}
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

            {/* Esqueleto de la caja de la mesa */}
            <div
              className="skeleton-block"
              style={{
                height: "70px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            ></div>

            {/* Esqueleto de los renglones de la lista */}
            <div
              className="skeleton-block"
              style={{ height: "45px", borderRadius: "12px" }}
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
                            accentColor: "#7b1fa2",
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
