import { useState, useEffect, useRef } from "react";
import "../styles/Invitacion.css";
import ximenaPortadas from "../assets/ximena_portada.webp";
import ximenaJardin from "../assets/ximena_jardin.webp";
import ximenaEspaldas from "../assets/ximen_espaldas.webp";
import ximenaEspaldas2 from "../assets/ximena_espaldas2.webp";
import ximenaCholo from "../assets/ximena_cholo.webp";
import ximenaCholoEscaleras from "../assets/ximena_cholo_escaleras.webp";
import ximenaVarandal from "../assets/ximena_varandal.webp";
import ximenaCoche from "../assets/ximena_coche.webp";

import ximenaJardinFull from "../assets/ximena_jardin_full.webp";
import ximenaEspaldasFull from "../assets/ximen_espaldas_full.webp"; // O como apunte a tu carpeta assets
import ximenaEspaldas2Full from "../assets/ximena_espaldas2_full.webp";
import ximenaCholoFull from "../assets/ximena_cholo_full.webp";
import ximenaCholoEscalerasFull from "../assets/ximena_cholo_escaleras_full.webp";
import ximenaVarandalFull from "../assets/ximena_varandal_full.webp";
import ximenaCocheFull from "../assets/ximena_coche_full.webp";

interface Integrante {
  id: number;
  nombre: string;
  confirmado_individual: boolean;
}

interface InvitacionProps {
  datos: {
    id: string;
    nombre_familia: string;
    confirmado: boolean;
  };
  integrantes: Integrante[];
  onVerPase: () => void;
}

interface MariposaInteractiva {
  id: number;
  x: number;
  y: number;
  isExplosion?: boolean;
  style?: React.CSSProperties;
}

// 📦 COMPONENTE A: ANIMACIÓN DE SCROLL
function ScrollAnimate({ children }: { children: React.ReactNode }) {
  const [esVisible, setEsVisible] = useState(false);
  const elementoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = elementoRef.current;
    if (!contenedor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEsVisible(true);
          observer.unobserve(entry.target); // Se vuelve visible y ya no se toca el estado
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" },
    );

    observer.observe(contenedor);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementoRef}
      className={`revelar-scroll ${esVisible ? "visible" : ""}`}
      style={{ width: "100%" }}
    >
      {children}
    </div>
  );
}

function CarruselAutonomo({
  onAmpliarFoto,
}: {
  onAmpliarFoto: (url: string) => void;
}) {
  const carruselRef = useRef<HTMLDivElement>(null);
  const [imagenesCargadas, setImagenesCargadas] = useState(false);

  const fotosOriginales = [
    { thumb: ximenaJardin, full: ximenaJardinFull },
    { thumb: ximenaEspaldas, full: ximenaEspaldasFull },
    { thumb: ximenaEspaldas2, full: ximenaEspaldas2Full },
    { thumb: ximenaCholo, full: ximenaCholoFull },
    { thumb: ximenaCholoEscaleras, full: ximenaCholoEscalerasFull },
    { thumb: ximenaVarandal, full: ximenaVarandalFull },
    { thumb: ximenaCoche, full: ximenaCocheFull },
  ];

  const fotosCarrusel = [
    fotosOriginales[fotosOriginales.length - 1],
    ...fotosOriginales,
    fotosOriginales[0],
  ];

  useEffect(() => {
    const promesas = fotosCarrusel.map((foto) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = foto.thumb;
        img.onload = resolve;
      });
    });

    Promise.all(promesas).then(() => {
      setImagenesCargadas(true);
    });
  }, []);

  useEffect(() => {
    if (!imagenesCargadas) return;

    const contenedor = carruselRef.current;
    if (!contenedor) return;

    // Calculamos el ancho base real de cada tarjeta
    const calcularAncho = () => contenedor.offsetWidth * 0.85 + 12;
    let anchoTarjeta = calcularAncho();
    contenedor.scrollLeft = anchoTarjeta;

    const manejarScrollInfinito = () => {
      const scrollMaximo = contenedor.scrollWidth - contenedor.clientWidth;
      if (contenedor.scrollLeft >= scrollMaximo - 5) {
        contenedor.style.scrollBehavior = "auto";
        contenedor.scrollLeft = anchoTarjeta;
      } else if (contenedor.scrollLeft <= 5) {
        contenedor.style.scrollBehavior = "auto";
        contenedor.scrollLeft = scrollMaximo - anchoTarjeta;
      }
    };

    contenedor.addEventListener("scroll", manejarScrollInfinito);

    const intervaloCarrusel = setInterval(() => {
      // Recalculamos dinámicamente en cada ciclo por si iOS alteró las dimensiones del viewport
      anchoTarjeta = calcularAncho();
      contenedor.style.scrollBehavior = "smooth";

      // Corregimos scrollBy usando opciones explícitas compatibles con Safari móvil
      contenedor.scrollTo({
        left: contenedor.scrollLeft + anchoTarjeta,
        behavior: "smooth",
      });
    }, 4500);

    // Ajuste responsivo ante rotación o redimensión en el iPhone
    const manejarResize = () => {
      anchoTarjeta = calcularAncho();
      contenedor.scrollLeft = anchoTarjeta;
    };
    window.addEventListener("resize", manejarResize);

    return () => {
      contenedor.removeEventListener("scroll", manejarScrollInfinito);
      window.removeEventListener("resize", manejarResize);
      clearInterval(intervaloCarrusel);
    };
  }, [imagenesCargadas]);

  if (!imagenesCargadas) {
    return (
      <div
        style={{
          height: "380px",
          background: "#fcfbfe",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "#b39dbf",
          }}
        >
          Preparando galería...
        </span>
      </div>
    );
  }

  return (
    <div
      ref={carruselRef}
      className="slider-fotos"
      style={{
        opacity: imagenesCargadas ? 1 : 0,
        transition: "opacity 0.4s ease",
        display: "flex", // Mantiene el flujo en línea horizontal
        overflowX: "auto", // Habilita el scroll manual si quieren arrastrar
        scrollSnapType: "x mandatory", // Hace que la foto se "imante" al centro al soltarla
        WebkitOverflowScrolling: "touch", // Desplazamiento ultra suave en iOS/Safari
        padding: "10px 0", // Micro espacio arriba y abajo para sombras si tienes
      }}
    >
      {fotosCarrusel.map((url, index) => (
        <div
          key={index}
          style={{
            minWidth: "80%", // 🟢 BAJAMOS A 80%: Esto hace que se asome un 15% - 20% de la siguiente foto
            marginRight: "12px", // El espacio elegante de separación entre tarjetas
            height: "380px",
            flexShrink: 0, // 🛡️ Impide que iPhone comprima o deforme la caja
            scrollSnapAlign: "center", // Centra la foto activa en la pantalla del celular
          }}
        >
          <img
            src={url.thumb}
            alt={`Book Ximena ${index}`}
            loading="eager"
            decoding="sync"
            onClick={() => onAmpliarFoto(url.full)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              cursor: "zoom-in",
              borderRadius: "12px", // Bordes redondeados de gala
            }}
          />
        </div>
      ))}
    </div>
  );
}
// 👑 COMPONENTE PRINCIPAL
export default function Invitacion({
  datos,
  integrantes,
  onVerPase,
}: InvitacionProps) {
  const [tiempoRestante, setTiempoRestante] = useState({
    dias: 0,
    horas: 0,
    minutes: 0,
  });
  const [mariposas, setMariposas] = useState<MariposaInteractiva[]>([]);
  const [conteoClics, setConteoClics] = useState(0);
  const [imagenMaximizada, setImagenMaximizada] = useState<string | null>(null);

  useEffect(() => {
    const laFecha = new Date("August 22, 2026 16:00:00").getTime();
    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const distancia = laFecha - ahora;

      if (distancia < 0) {
        clearInterval(intervalo);
        setTiempoRestante({ dias: 0, horas: 0, minutes: 0 });
      } else {
        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
        const horas = Math.floor(
          (distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutos = Math.floor(
          (distancia % (1000 * 60 * 60)) / (1000 * 60),
        );
        setTiempoRestante({ dias, horas, minutes: minutos });
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const manejarPantallaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickX = e.pageX;
    const clickY = e.pageY;
    const baseId = Date.now();
    const nuevoConteo = conteoClics + 1;

    if (nuevoConteo === 15) {
      const rafagaMariposas: MariposaInteractiva[] = [];

      for (let i = 0; i < 60; i++) {
        const desvioX = (Math.random() - 0.5) * 70;
        const desvioY = (Math.random() - 0.5) * 70;
        const idEspecifico = baseId + i;

        rafagaMariposas.push({
          id: idEspecifico,
          x: clickX + desvioX,
          y: clickY + desvioY,
          isExplosion: true,
          style: {
            "--angulo-disparo": `${Math.random() * 360}deg`,
            "--distancia-disparo": `${100 + Math.random() * 180}px`,
            animationDuration: `${0.6 + Math.random() * 0.8}s`,
            fontSize: `${12 + Math.random() * 16}px`,
          } as React.CSSProperties,
        });

        setTimeout(() => {
          setMariposas((prev) => prev.filter((m) => m.id !== idEspecifico));
        }, 1500);
      }

      setMariposas((prev) => [...prev, ...rafagaMariposas]);
      setConteoClics(0);
    } else {
      const nuevaMariposa: MariposaInteractiva = {
        id: baseId,
        x: clickX,
        y: clickY,
        isExplosion: false,
      };

      setConteoClics(nuevoConteo);
      setMariposas((prev) => [...prev, nuevaMariposa]);

      setTimeout(() => {
        setMariposas((prev) => prev.filter((m) => m.id !== nuevaMariposa.id));
      }, 1000);
    }
  };

  const fotoPrincipal = ximenaPortadas;
  return (
    <div className="invitacion-container" onClick={manejarPantallaClick}>
      {/* 🔮 RENDER DE LAS MARIPOSAS DINÁMICAS */}
      {mariposas.map((m) => (
        <span
          key={m.id}
          className={`mariposa-click ${m.isExplosion ? "mariposa-bomba" : ""}`}
          style={{
            top: `${m.y}px`,
            left: `${m.x}px`,
            ...m.style,
          }}
        >
          🦋
        </span>
      ))}

      {/* 🦋 SOLO 3 MARIPOSAS AUTOMÁTICAS DE FONDO */}
      <div
        className="mariposa-fondo"
        style={{ left: "10%", animationDelay: "0s" }}
      >
        🦋
      </div>
      <div
        className="mariposa-fondo"
        style={{ left: "75%", animationDelay: "10s", fontSize: "16px" }}
      >
        🦋
      </div>
      <div
        className="mariposa-fondo"
        style={{ left: "35%", animationDelay: "20s", fontSize: "16px" }}
      >
        🦋
      </div>

      {/* 🌸 SECCIÓN 1: HEADER */}
      <div className="header-invitacion">
        <span className="subtitulo-caps">Te invito a celebrar mis XV Años</span>
        <h1 className="titulo-gala">Ximena</h1>
        <p
          style={{
            fontSize: "15px",
            fontStyle: "italic",
            color: "#6d6d72",
            maxWidth: "290px",
            margin: "0 auto",
            lineHeight: "1.7",
            letterSpacing: "0.2px",
          }}
        >
          "Hay momentos únicos en la vida, y compartirlos con las personas que
          más quiero los hace inolvidables."
        </p>
      </div>

      {/* 📸 SECCIÓN 2: IMAGEN PRINCIPAL DESTACADA */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 35px auto",
          padding: "0 20px",
        }}
      >
        <div className="tarjeta-gala" style={{ padding: "12px" }}>
          <div
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              height: "400px",
              border: "1px solid #f1ebf2",
            }}
          >
            <img
              src={fotoPrincipal}
              alt="Ximena Gala"
              onClick={() => setImagenMaximizada(fotoPrincipal)} // 👈 Agrega esto
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                cursor: "zoom-in",
              }} // 👈 Asegúrate de que tenga el cursor
            />
          </div>
        </div>
      </div>

      {/* ⏳ SECCIÓN 3: CUENTA REGRESIVA */}
      <div
        style={{
          textAlign: "center",
          margin: "0 auto 40px auto",
          maxWidth: "340px",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <p className="subtitulo-caps" style={{ marginBottom: "8px" }}>
            22 de Agosto de 2026
          </p>
          <div className="contador-box">
            <div>
              <b>{tiempoRestante.dias}</b>
              <div style={{ fontSize: "11px", color: "#8e8e93" }}>Días</div>
            </div>
            <div>
              <b>{tiempoRestante.horas}</b>
              <div style={{ fontSize: "11px", color: "#8e8e93" }}>Horas</div>
            </div>
            <div>
              <b>{tiempoRestante.minutes}</b>
              <div style={{ fontSize: "11px", color: "#8e8e93" }}>Minutos</div>
            </div>
          </div>
        </ScrollAnimate>
      </div>

      {/* 👨‍👩‍👦 SECCIÓN 4: FAMILIA */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{ padding: "35px 20px", textAlign: "center" }}
          >
            <span className="texto-cursiva">
              Con la bendición de mis padres
            </span>
            <p className="nombre-gala" style={{ margin: "5px 0 25px 0" }}>
              Sayuri Copado Vargas <br /> & <br /> Raymundo Morales Fitz
            </p>
            <span className="texto-cursiva">Mi querido hermano</span>
            <p className="nombre-gala" style={{ margin: "5px 0 25px 0" }}>
              Diego Rodrigo Morales Copado
            </p>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "#eae1eb",
                margin: "0 auto 20px auto",
              }}
            ></div>
            <span className="texto-cursiva">Y mis padrinos</span>
            <p className="nombre-gala" style={{ margin: "5px 0 0 0" }}>
              Andrea Copado Vargas <br /> & <br /> Oscar Tavarez Sotelo
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* 📸 🔥 SECCIÓN DEL CARRUSEL (Búscalo abajo en tu render principal) */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          {/* 🟢 Pasamos la función controladora para revivir el zoom de las fotos */}
          <CarruselAutonomo onAmpliarFoto={(url) => setImagenMaximizada(url)} />
        </ScrollAnimate>
      </div>

      {/* 🕒 SECCIÓN 6: HORARIOS */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 35px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div style={{ textAlign: "center" }}>
            <span className="texto-cursiva">Horarios del Evento</span>
            <p
              style={{
                fontSize: "14px",
                color: "#444",
                lineHeight: "1.7",
                margin: "5px 0 0 0",
              }}
            >
              Misa de Acción de Gracias: <strong>4:00 PM</strong> <br />
              Recepción de Gala: <strong>5:30 PM</strong>
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <div
                style={{ width: "30px", height: "1px", background: "#7b1fa2" }}
              ></div>
              <span style={{ fontSize: "20px", color: "#d1c4e9" }}>🦋</span>
              <div
                style={{ width: "30px", height: "1px", background: "#7b1fa2" }}
              ></div>
            </div>
          </div>
        </ScrollAnimate>
      </div>

      {/* ⛪ SECCIÓN 7: DIRECCIONES */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{
              padding: "25px 20px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "22px" }}>⛪</span>
            <h3
              style={{
                fontSize: "16px",
                color: "#3a3a3a",
                margin: "8px 0 4px 0",
                fontWeight: "500",
              }}
            >
              Ceremonia Religiosa
            </h3>
            <span
              className="subtitulo-caps"
              style={{ color: "#7b1fa2", marginBottom: "8px" }}
            >
              Parroquia de San Luis Obispo
            </span>
            <p
              style={{
                fontSize: "13px",
                color: "#666",
                margin: "0 0 15px 0",
                lineHeight: "1.4",
              }}
            >
              San Luis Obispo, Amatitlán, Cuernavaca, Mor.
            </p>
            <a
              href="https://www.google.com/maps/place/Parroquia+de+San+Luis+Obispo/@18.9232171,-99.2298525,16z/data=!4m6!3m5!1s0x85cddfb21a373bbb:0x6ccfac2b8d3cb679!8m2!3d18.9233032!4d-99.2294852!16s%2Fg%2F11b61r27hp?hl=es-419&entry=ttu"
              target="_blank"
              rel="noreferrer"
              className="btn-mapa-iglesia"
            >
              📍 Ver Ubicación en Maps
            </a>
          </div>
        </ScrollAnimate>

        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{ padding: "25px 20px", textAlign: "center" }}
          >
            <span style={{ fontSize: "22px" }}>🏡</span>
            <h3
              style={{
                fontSize: "16px",
                color: "#3a3a3a",
                margin: "8px 0 4px 0",
                fontWeight: "500",
              }}
            >
              Recepción
            </h3>
            <span
              className="subtitulo-caps"
              style={{ color: "#7b1fa2", marginBottom: "8px" }}
            >
              Jardín "Gold Rain"
            </span>
            <p
              style={{ fontSize: "13px", color: "#666", margin: "0 0 15px 0" }}
            >
              Jiutepec, Morelos.
            </p>
            <a
              href="https://www.google.com/maps/place/Jard%C3%ADn+Gold+Rain/@18.881283,-99.2027411,17z/data=!4m6!3m5!1s0x85cddf44b0b18a4d:0x31640443c220610b!8m2!3d18.8812322!4d-99.2015395!16s%2Fg%2F11cn5n33kc?hl=es-MX"
              target="_blank"
              rel="noreferrer"
              className="btn-mapa-salon"
            >
              🥳 Ver Ubicación del Jardín
            </a>
          </div>
        </ScrollAnimate>
      </div>

      {/* 👗 SECCIÓN 8: DRESS CODE */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{
              padding: "25px 20px",
              textAlign: "center",
              background: "#ffffff",
            }}
          >
            <span style={{ fontSize: "20px" }}>👗</span>
            <h3
              style={{
                fontSize: "13px",
                color: "#3b1b54",
                margin: "8px 0 5px 0",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Código de Vestimenta
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#2c2c2e",
                fontWeight: "600",
                margin: "0 0 10px 0",
              }}
            >
              Formal
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#6d6d72",
                margin: 0,
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              "Con mucho cariño les pedimos que los tonos{" "}
              <strong>morado, lila y tonalidades similares</strong> están
              reservados exclusivamente para la quinceañera."
              <br />
              (Arréglate bonito que habrá fotógrafo y gente chismosa 👀)
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* ✉️ SECCIÓN 9: LLUVIA DE SOBRES */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{ padding: "25px 20px", textAlign: "center" }}
          >
            <span style={{ fontSize: "22px" }}>✉️</span>
            <h3
              style={{
                fontSize: "13px",
                color: "#3b1b54",
                margin: "8px 0 8px 0",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Lluvia de Sobres
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#6d6d72",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              Tu presencia es nuestro mejor regalo. Si deseas tener un detalle
              con Ximena, contaremos con una <strong>lluvia de sobres</strong>.
              En la entrada del salón encontrarás los sobres y una urna para
              depositarlos.
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* 🕒 SECCIÓN 10: CONFIRMAR */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto 40px auto",
          padding: "0 20px",
        }}
      >
        <ScrollAnimate>
          <div
            className="tarjeta-gala"
            style={{ padding: "25px 20px", textAlign: "center" }}
          >
            <span style={{ fontSize: "22px" }}>✅</span>
            <h3
              style={{
                fontSize: "13px",
                color: "#3b1b54",
                margin: "8px 0 8px 0",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Confirmar Asistencia
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#6d6d72",
                margin: "0 0 15px 0",
                lineHeight: "1.5",
              }}
            >
              Para ayudarnos a tener una mejor organización en las mesas,
              confírmanos tu asistencia lo antes posible.
            </p>
            <a
              href={`https://wa.me/527779141624?text=${encodeURIComponent(`¡Hola! Confirmo la asistencia de la ${datos?.nombre_familia} para los XV de Ximena.`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-mapa-salon"
              style={{
                display: "block",
                textAlign: "center",
                background: "#25D366",
                boxShadow: "none",
              }}
            >
              💬 Confirmar por WhatsApp
            </a>
          </div>
        </ScrollAnimate>
      </div>

      {/* 🎟️ SECCIÓN 11: PASES */}
      <div
        style={{
          maxWidth: "360px",
          margin: "0 auto",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: "30px 20px" }}>
            <span className="subtitulo-caps" style={{ marginBottom: "5px" }}>
              Pase de Acceso Exclusivo
            </span>
            <h2
              style={{
                color: "#3b1b54",
                margin: "0 0 10px 0",
                fontSize: "22px",
                fontWeight: "400",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {datos?.nombre_familia}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6d6d72",
                margin: "0 0 20px 0",
                lineHeight: "1.5",
              }}
            >
              Abre tus pases interactivos para conocer tu mesa oficial y generar
              el código QR de acceso al salón.
            </p>
            <button onClick={onVerPase} className="btn-oscuro">
              📥 Ver y Descargar Pases
            </button>
          </div>
        </ScrollAnimate>
      </div>

      {imagenMaximizada && (
        <div
          onClick={() => setImagenMaximizada(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 8, 20, 0.95)",
            zIndex: 99999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImagenMaximizada(null);
            }}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              fontSize: "20px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "sans-serif",
              zIndex: 100000,
            }}
          >
            ✕
          </button>

          <img
            src={imagenMaximizada}
            alt="Vista Ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              borderRadius: "12px",
              boxShadow: "0 10px 35px rgba(0, 0, 0, 0.6)",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}
