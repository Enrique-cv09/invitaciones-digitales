import { useState, useEffect, useRef } from 'react';
import '../styles/Invitacion.css';
import ximenaPortadas from '../assets/ximena_portada.webp';
import ximenaJardin from '../assets/ximena_jardin.webp';
import ximenaEspaldas from '../assets/ximen_espaldas.webp';
import ximenaEspaldas2 from '../assets/ximena_espaldas2.webp';
import ximenaCholo from '../assets/ximena_cholo.webp';
import ximenaCholoEscaleras from '../assets/ximena_cholo_escaleras.webp';
import ximenaVarandal from '../assets/ximena_varandal.webp';
import ximenaCoche from '../assets/ximena_coche.webp';

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
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(contenedor);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={elementoRef} className={`revelar-scroll ${esVisible ? 'visible' : ''}`} style={{ width: '100%' }}>
      {children}
    </div>
  );
}

// 📸 🔥 COMPONENTE B: SUBCOMPONENTE DEL CARRUSEL AISLADO (Evita que parpadee el resto de la app)
function CarruselAutonomo() {
  const carruselRef = useRef<HTMLDivElement>(null);
  const [imagenesCargadas, setImagenesCargadas] = useState(false);

  const fotosOriginales = [
    ximenaJardin,
    ximenaEspaldas,
    ximenaEspaldas2,
    ximenaCholo,
    ximenaCholoEscaleras,
    ximenaVarandal,
    ximenaCoche
  ];

  // 1. GENERAMOS EL CONTENIDO CLONADO PARA EL INFINITO
  const fotosCarrusel = [
    fotosOriginales[fotosOriginales.length - 1],
    ...fotosOriginales,
    fotosOriginales[0]
  ];

  // 2. 🔥 EFECTO DE PRECARGA: Obliga al navegador a meter las fotos en caché ANTES de activar el movimiento
  useEffect(() => {
    const promesas = fotosCarrusel.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
      });
    });

    Promise.all(promesas).then(() => {
      setImagenesCargadas(true); // Solo arranca cuando TODO esté listo en la memoria del cel
    });
  }, []);

  // 3. LOGICA DE DESPLAZAMIENTO INFINITO OPTIMIZADA
  useEffect(() => {
    if (!imagenesCargadas) return; // Espera el silbatazo de la precarga

    const contenedor = carruselRef.current;
    if (!contenedor) return;

    const anchoTarjeta = contenedor.offsetWidth * 0.85 + 12;
    contenedor.scrollLeft = anchoTarjeta;

    const manejarScrollInfinito = () => {
      const scrollMaximo = contenedor.scrollWidth - contenedor.clientWidth;
      if (contenedor.scrollLeft >= scrollMaximo - 5) {
        contenedor.style.scrollBehavior = 'auto';
        contenedor.scrollLeft = anchoTarjeta;
      } else if (contenedor.scrollLeft <= 5) {
        contenedor.style.scrollBehavior = 'auto';
        contenedor.scrollLeft = scrollMaximo - anchoTarjeta;
      }
    };

    contenedor.addEventListener('scroll', manejarScrollInfinito);
    
    const intervaloCarrusel = setInterval(() => {
      // Forzamos comportamiento smooth solo en el trigger del movimiento
      contenedor.style.scrollBehavior = 'smooth';
      contenedor.scrollBy({ left: anchoTarjeta });
    }, 4500); // Bajamos un poco a 4.5s para que la transición sea más dinámica

    return () => {
      contenedor.removeEventListener('scroll', manejarScrollInfinito);
      clearInterval(intervaloCarrusel);
    };
  }, [imagenesCargadas]);

  // Si no se han terminado de procesar en caché, mostramos un micro esqueleto elegante
  if (!imagenesCargadas) {
    return (
      <div style={{ height: '380px', background: '#fcfbfe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#b39dbf' }}>Preparando galería...</span>
      </div>
    );
  }

  return (
    <div ref={carruselRef} className="slider-fotos" style={{ opacity: imagenesCargadas ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {fotosCarrusel.map((url, index) => (
        <div key={index}>
          <img 
            src={url} 
            alt={`Book Ximena ${index}`} 
            loading="eager"       /* 🔥 Fuerza al navegador a cargarla de golpe, ya no lazy */
            decoding="sync"       /* ⚡ Sincroniza la decodificación para evitar el renderizado a la mitad */
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  );
}

// 👑 COMPONENTE PRINCIPAL
export default function Invitacion({ datos, integrantes, onVerPase }: InvitacionProps) {
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutes: 0 });
  const [mariposas, setMariposas] = useState<MariposaInteractiva[]>([]);
  const [conteoClics, setConteoClics] = useState(0);

  useEffect(() => {
    const laFecha = new Date('August 22, 2026 16:00:00').getTime();
    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const distancia = laFecha - ahora;

      if (distancia < 0) {
        clearInterval(intervalo);
        setTiempoRestante({ dias: 0, horas: 0, minutes: 0 });
      } else {
        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
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
            '--angulo-disparo': `${Math.random() * 360}deg`,
            '--distancia-disparo': `${100 + Math.random() * 180}px`,
            animationDuration: `${0.6 + Math.random() * 0.8}s`,
            fontSize: `${12 + Math.random() * 16}px`
          } as React.CSSProperties
        });

        setTimeout(() => {
          setMariposas(prev => prev.filter(m => m.id !== idEspecifico));
        }, 1500);
      }

      setMariposas(prev => [...prev, ...rafagaMariposas]);
      setConteoClics(0);

    } else {
      const nuevaMariposa: MariposaInteractiva = {
        id: baseId,
        x: clickX,
        y: clickY,
        isExplosion: false
      };
      
      setConteoClics(nuevoConteo);
      setMariposas(prev => [...prev, nuevaMariposa]);
      
      setTimeout(() => {
        setMariposas(prev => prev.filter(m => m.id !== nuevaMariposa.id));
      }, 1000);
    }
  };

  const fotoPrincipal = ximenaPortadas;
  return (
    <div className="invitacion-container" onClick={manejarPantallaClick}>
      
      {/* 🔮 RENDER DE LAS MARIPOSAS DINÁMICAS */}
      {mariposas.map(m => (
        <span 
          key={m.id} 
          className={`mariposa-click ${m.isExplosion ? 'mariposa-bomba' : ''}`} 
          style={{ 
            top: `${m.y}px`, 
            left: `${m.x}px`,
            ...m.style 
          }}
        >
          🦋
        </span>
      ))}

      {/* 🦋 SOLO 2 MARIPOSAS AUTOMÁTICAS DE FONDO */}
      <div className="mariposa-fondo" style={{ left: '10%', animationDelay: '0s' }}>🦋</div>
      <div className="mariposa-fondo" style={{ left: '75%', animationDelay: '10s', fontSize: '16px' }}>🦋</div>

      {/* 🌸 SECCIÓN 1: HEADER */}
      <div className="header-invitacion">
        <span className="subtitulo-caps">Te invito a celebrar mis XV Años</span>
        <h1 className="titulo-gala">Ximena</h1>
        <p style={{ 
          fontSize: '15px', 
          fontStyle: 'italic', 
          color: '#6d6d72', 
          maxWidth: '290px', 
          margin: '0 auto', 
          lineHeight: '1.7',
          letterSpacing: '0.2px'
        }}>
          "Hay momentos únicos en la vida, y compartirlos con las personas que más quiero los hace inolvidables."
        </p>
      </div>

      {/* 📸 SECCIÓN 2: IMAGEN PRINCIPAL DESTACADA */}
      <div style={{ maxWidth: '360px', margin: '0 auto 35px auto', padding: '0 20px' }}>
        <div className="tarjeta-gala" style={{ padding: '12px' }}>
          <div style={{ borderRadius: '10px', overflow: 'hidden', height: '400px', border: '1px solid #f1ebf2' }}>
            <img src={fotoPrincipal} alt="Ximena Gala" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      {/* ⏳ SECCIÓN 3: CUENTA REGRESIVA */}
      <div style={{ textAlign: 'center', margin: '0 auto 40px auto', maxWidth: '340px', padding: '0 20px' }}>
        <ScrollAnimate>
          <p className="subtitulo-caps" style={{ marginBottom: '8px' }}>22 de Agosto de 2026</p>
          <div className="contador-box">
            <div><b>{tiempoRestante.dias}</b><div style={{ fontSize: '11px', color: '#8e8e93' }}>Días</div></div>
            <div><b>{tiempoRestante.horas}</b><div style={{ fontSize: '11px', color: '#8e8e93' }}>Horas</div></div>
            <div><b>{tiempoRestante.minutes}</b><div style={{ fontSize: '11px', color: '#8e8e93' }}>Minutos</div></div>
          </div>
        </ScrollAnimate>
      </div>

      {/* 👨‍👩‍👦 SECCIÓN 4: FAMILIA */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '35px 20px', textAlign: 'center' }}>
            <span className="texto-cursiva">Con la bendición de mis padres</span>
            <p className="nombre-gala" style={{ margin: '5px 0 25px 0' }}>
              Sayuri Copado Vargas <br /> & <br /> Raimundo Morales Fitz
            </p>
            <span className="texto-cursiva">Mi querido hermano</span>
            <p className="nombre-gala" style={{ margin: '5px 0 25px 0' }}>
              Diego Rodrigo Morales Copado
            </p>
            <div style={{ width: '40px', height: '1px', background: '#eae1eb', margin: '0 auto 20px auto' }}></div>
            <span className="texto-cursiva">Y mis padrinos</span>
            <p className="nombre-gala" style={{ margin: '5px 0 0 0' }}>
              Andrea Copado Vargas <br /> & <br /> Oscar Tavares Sotelo
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* 📸 🔥 SECCIÓN DEL CARRUSEL (Invocando al componente autónomo blindado) */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <CarruselAutonomo />
        </ScrollAnimate>
      </div>

      {/* 🕒 SECCIÓN 6: HORARIOS */}
      <div style={{ maxWidth: '360px', margin: '0 auto 35px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div style={{ textAlign: 'center' }}>
            <span className="texto-cursiva">Horarios del Evento</span>
            <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.7', margin: '5px 0 0 0' }}>
              Misa de Acción de Gracias: <strong>4:00 PM</strong> <br />
              Recepción de Gala: <strong>5:30 PM</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
              <div style={{ width: '30px', height: '1px', background: '#eae1eb' }}></div>
              <span style={{ fontSize: '12px', color: '#d1c4e9' }}>🦋</span>
              <div style={{ width: '30px', height: '1px', background: '#eae1eb' }}></div>
            </div>
          </div>
        </ScrollAnimate>
      </div>

      {/* ⛪ SECCIÓN 7: DIRECCIONES */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '25px 20px', textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>⛪</span>
            <h3 style={{ fontSize: '16px', color: '#3a3a3a', margin: '8px 0 4px 0', fontWeight: '500' }}>Ceremonia Religiosa</h3>
            <span className="subtitulo-caps" style={{ color: '#7b1fa2', marginBottom: '8px' }}>Parroquia de San Luis Obispo</span>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0', lineHeight: '1.4' }}>San Luis Obispo, Amatitlán, Cuernavaca, Mor.</p>
            <a href="https://www.google.com/maps/place/Parroquia+de+San+Luis+Obispo/@18.9232171,-99.2298525,16z/data=!4m6!3m5!1s0x85cddfb21a373bbb:0x6ccfac2b8d3cb679!8m2!3d18.9233032!4d-99.2294852!16s%2Fg%2F11b61r27hp?hl=es-419&entry=ttu" target="_blank" rel="noreferrer" className="btn-mapa-iglesia">
              📍 Ver Ubicación en Maps
            </a>
          </div>
        </ScrollAnimate>

        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '25px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '22px' }}>🏡</span>
            <h3 style={{ fontSize: '16px', color: '#3a3a3a', margin: '8px 0 4px 0', fontWeight: '500' }}>Recepción</h3>
            <span className="subtitulo-caps" style={{ color: '#7b1fa2', marginBottom: '8px' }}>Jardín "Gold Rain"</span>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0' }}>Jiutepec, Morelos.</p>
            <a href="https://www.google.com/maps/place/Jard%C3%ADn+Gold+Rain/@18.881283,-99.2027411,17z/data=!4m6!3m5!1s0x85cddf44b0b18a4d:0x31640443c220610b!8m2!3d18.8812322!4d-99.2015395!16s%2Fg%2F11cn5n33kc?hl=es-MX" target="_blank" rel="noreferrer" className="btn-mapa-salon">
              🥳 Ver Ubicación del Jardín
            </a>
          </div>
        </ScrollAnimate>
      </div>

      {/* 👗 SECCIÓN 8: DRESS CODE */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '25px 20px', textAlign: 'center', background: '#ffffff' }}>
            <span style={{ fontSize: '20px' }}>👗</span>
            <h3 style={{ fontSize: '13px', color: '#3b1b54', margin: '8px 0 5px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Código de Vestimenta</h3>
            <p style={{ fontSize: '14px', color: '#2c2c2e', fontWeight: '600', margin: '0 0 10px 0' }}>Formal / Gala</p>
            <p style={{ fontSize: '13px', color: '#6d6d72', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
              "Con mucho cariño les pedimos que los tonos <strong>morado, lila y tonalidades similares</strong> están reservados exclusivamente para la quinceañera."
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* ✉️ SECCIÓN 9: LLUVIA DE SOBRES */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '25px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '22px' }}>✉️</span>
            <h3 style={{ fontSize: '13px', color: '#3b1b54', margin: '8px 0 8px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Lluvia de Sobres</h3>
            <p style={{ fontSize: '13px', color: '#6d6d72', margin: 0, lineHeight: '1.6' }}>
              Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con Ximena, contaremos con una <strong>lluvia de sobres</strong>. En la entrada del salón encontrarás los sobres and una urna para depositarlos.
            </p>
          </div>
        </ScrollAnimate>
      </div>

      {/* 🕒 SECCIÓN 10: CONFIRMAR */}
      <div style={{ maxWidth: '360px', margin: '0 auto 40px auto', padding: '0 20px' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '25px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '22px' }}>✅</span>
            <h3 style={{ fontSize: '13px', color: '#3b1b54', margin: '8px 0 8px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirmar Asistencia</h3>
            <p style={{ fontSize: '13px', color: '#6d6d72', margin: '0 0 15px 0', lineHeight: '1.5' }}>
              Para ayudarnos a tener una mejor organización en las mesas, confírmanos tu asistencia lo antes posible.
            </p>
            <a 
              href={`https://wa.me/5217771234567?text=${encodeURIComponent(`¡Hola! Confirmo la asistencia de la ${datos?.nombre_familia} para los XV de Ximena.`)}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-mapa-salon"
              style={{ display: 'block', textAlign: 'center', background: '#25D366', boxShadow: 'none' }}
            >
              💬 Confirmar por WhatsApp
            </a>
          </div>
        </ScrollAnimate>
      </div>

      {/* 🎟️ SECCIÓN 11: PASES */}
      <div style={{ maxWidth: '360px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
        <ScrollAnimate>
          <div className="tarjeta-gala" style={{ padding: '30px 20px' }}>
            <span className="subtitulo-caps" style={{ marginBottom: '5px' }}>Pase de Acceso Exclusivo</span>
            <h2 style={{ color: '#3b1b54', margin: '0 0 10px 0', fontSize: '22px', fontWeight: '400', fontFamily: "'Playfair Display', serif" }}>
              {datos?.nombre_familia}
            </h2>
            <p style={{ fontSize: '13px', color: '#6d6d72', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Abre tus pases interactivos para conocer tu mesa oficial y generar el código QR de acceso al salón.
            </p>
            <button onClick={onVerPase} className="btn-oscuro">
              📥 Ver y Descargar Pases
            </button>
          </div>
        </ScrollAnimate>
      </div>
    </div>
  );
}