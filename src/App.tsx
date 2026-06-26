import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseClient';
import Invitacion from './pages/Invitacion';
import Hostess from './pages/Hostess';
import { QRCodeSVG } from 'qrcode.react'; // 🔥 Generador real de QR
import html2canvas from 'html2canvas'; // 🔥 Librería para convertir HTML en Imagen real

export default function App() {
  const [familia, setFamilia] = useState<any>(null);
  const [integrantes, setIntegrantes] = useState<any[]>([]);
  const [esStaff, setEsStaff] = useState(false);
  const [esPase, setEsPase] = useState(false); // 🔥 Estado para capturar la pantalla del QR en el mismo archivo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 🌀 ESTADO PARA LA PANTALLA DE CARGA INTERMEDIA DEL PASE
  const [generandoPase, setGenerandoPase] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idUrl = params.get('id');
    const staffUrl = params.get('staff');
    const paseUrl = params.get('pase'); // Capturamos parámetro inicial de URL si existe

    if (!idUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    setEsStaff(staffUrl === 'true');
    setEsPase(paseUrl === 'true');

    // 1. Cargar Familia e Integrantes desde Supabase
    const inicializarDatos = async () => {
      const { data: dataFamilia, error: errFam } = await supabase
        .from('familias')
        .select('*')
        .eq('id', idUrl)
        .maybeSingle();

      if (errFam || !dataFamilia) {
        setError(true);
        setLoading(false);
        return;
      }

      // 📝 Nota: Mantenemos la carga por si la hostess la necesita, pero la removemos del render del pase
      let nombreMesaFinal = 'Sin Asignar';
      if (dataFamilia.mesa_id) {
        const { data: dataMesa } = await supabase
          .from('mesas')
          .select('nombre_mesa')
          .eq('id', dataFamilia.mesa_id)
          .maybeSingle();
          
        if (dataMesa) {
          nombreMesaFinal = dataMesa.nombre_mesa;
        }
      }

      const familiaFormateada = {
        ...dataFamilia,
        mesas: { nombre_mesa: nombreMesaFinal }
      };

      const { data: dataIntegrantes, error: errInt } = await supabase
        .from('integrantes')
        .select('*')
        .eq('familia_id', idUrl)
        .order('id', { ascending: true });

      if (errInt) {
        setError(true);
      } else {
        setFamilia(familiaFormateada);
        setIntegrantes(dataIntegrantes || []);
      }
      setLoading(false);
    };

    inicializarDatos();

    // 2. 🔥 TIEMPO REAL: Escuchar cambios en los integrantes de esta familia
    const canalIntegrantes = supabase
      .channel('cambios-integrantes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'integrantes', filter: `familia_id=eq.${idUrl}` },
        (payload) => {
          setIntegrantes(prev => prev.map(int => int.id === payload.new.id ? payload.new : int));
        }
      )
      .subscribe();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);
  
  // 4. La Hostess registra la entrada de las personas seleccionadas en el salón
  const manejarIngresoHostess = async (idsAIngresar: number[]) => {
    const ahora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const promesas = idsAIngresar.map(id => 
      supabase
        .from('integrantes')
        .update({ asistio: true, hora_ingreso: ahora })
        .eq('id', id)
    );

    await Promise.all(promesas);
    alert('¡Ingreso registrado correctamente en Supabase!');
  };

  // 🔥 FUNCIÓN ENVOLVENTE CON LOADER DE GALA Y RESET DE SCROLL AL TOP
  const activarFlujoPase = () => {
    setGenerandoPase(true); // 1. Desplegamos el loader en pantalla

    setTimeout(() => {
      window.scrollTo(0, 0);   // 2. Mandamos el scroll hasta arriba del todo antes del render
      setEsPase(true);         // 3. Montamos la vista del pase digital
      setGenerandoPase(false); // 4. Desmontamos el loader
    }, 3000); // 3 segundos para que luzca la animación del spinner lila
  };

  // 🔥 FUNCIÓN PARA CAPTURAR LA TARJETA Y CONVERTIRLA EN IMAGEN DESCARGABLE
  const descargarPaseImagen = () => {
    const tarjetaElemento = document.getElementById('tarjeta-boleto-qr');
    if (!tarjetaElemento) return;

    html2canvas(tarjetaElemento, {
      scale: 3, // Multiplica x3 la resolución para que el QR sea nítido al escanearse en la puerta
      backgroundColor: '#ffffff', // Fuerza que el fondo sea blanco en la foto guardada
      logging: false,
      useCORS: true
    }).then((canvas) => {
      const imagenBase64 = canvas.toDataURL('image/png');
      const enlaceDescarga = document.createElement('a');
      enlaceDescarga.href = imagenBase64;
      enlaceDescarga.download = `Pase_XV_${familia?.nombre_familia || 'Invitado'}.png`;
      enlaceDescarga.click();
    });
  };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>Conectando con Supabase...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif', textAlign: 'center' }}>⚠️ Código inválido o error de conexión.</div>;

  // 🚪 RENDER 1: VISTA DE LA HOSTESS (Check-in con cámara integrada en tiempo real)
  if (esStaff) {
    return <Hostess onRegistrarIngreso={manejarIngresoHostess} />;
  }

  // 🎟️ RENDER 2: VISTA INDEPENDIENTE DEL PASE DIGITAL (MODERNIZADO A LILA Y PLATINO)
  if (esPase) {
    const urlHostessQR = `${window.location.origin}/?id=${familia?.id}&staff=true`;
    return (
      <div className="invitacion-container" style={{ paddingBottom: '60px', minHeight: '100vh' }}>
        
        {/* 🦋 SÓLO 2 MARIPOSAS AUTOMÁTICAS DE FONDO */}
        <div className="mariposa-fondo" style={{ left: '10%', animationDelay: '0s' }}>🦋</div>
        <div className="mariposa-fondo" style={{ left: '75%', animationDelay: '10s', fontSize: '16px' }}>🦋</div>

        {/* 🌸 HEADER DEL PASE */}
        <div className="header-invitacion" style={{ padding: '40px 24px 15px 24px' }}>
          {/* ⬅️ BOTÓN REGRESAR */}
          <button 
            onClick={() => { window.scrollTo(0, 0); setEsPase(false); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7b1fa2',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '15px',
              fontFamily: "'Montserrat', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            ← Volver a la Invitación
          </button>

          <h1 className="titulo-gala" style={{ fontSize: '44px', margin: '5px 0' }}>
            Ximena
          </h1>
          <span className="subtitulo-caps">
            🎟️ Pase Digital Oficial 🎟️
          </span>
        </div>

        {/* 🎫 CARD PRINCIPAL DEL BOLETO */}
<div style={{ maxWidth: '360px', margin: '15px auto 0 auto', padding: '0 20px' }}>
  {/* html2canvas toma la foto de TODO lo que esté dentro de este contenedor */}
  <div id="tarjeta-boleto-qr" className="tarjeta-gala" style={{ padding: '35px 20px', textAlign: 'center' }}>
    
    <span className="texto-cursiva" style={{ fontSize: '18px', marginBottom: '2px' }}>
      Acceso exclusivo para:
    </span>
    <h2 className="nombre-gala" style={{ fontSize: '22px', margin: '0 0 10px 0' }}>
      {familia?.nombre_familia}
    </h2>

    {/* CONTENEDOR DEL QR */}
    <div style={{ 
      background: '#fff', 
      padding: '15px', 
      display: 'inline-block', 
      borderRadius: '16px', 
      marginBottom: '25px', 
      border: '1px solid #eae1eb',
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
      marginTop: '15px'
    }}>
      <QRCodeSVG 
        value={urlHostessQR}
        size={180}
        bgColor={"#ffffff"}
        fgColor={"#3b1b54"}
        level={"M"}
      />
    </div>

    {/* 🔢 ASIENTOS RESERVADOS */}
    <div style={{ 
      background: 'linear-gradient(135deg, #fdfbfe 0%, #f3e5f5 100%)', 
      border: '1px solid #e1bee7', 
      borderRadius: '12px', 
      padding: '14px', 
      margin: '0 auto 25px auto',
      maxWidth: '240px'
    }}>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#8e8e93', display: 'block', marginBottom: '2px', fontWeight: '500' }}>Asientos Reservados</span>
      <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#4a148c', fontWeight: '500' }}>
        {integrantes?.length} { integrantes?.length === 1 ? 'Persona' : 'Personas' }
      </strong>
    </div>

    <p style={{ fontSize: '12px', color: '#6d6d72', margin: '0 0 25px 0', lineHeight: '1.6', fontFamily: "'Montserrat', sans-serif" }}>
      Presenta este código QR en la entrada del salón. Te sugerimos tomar una captura de pantalla para un acceso rápido.
    </p>

    {/* 🔥 AQUÍ ESTÁ EL CAMBIO PRINCIPAL: Añadido 'data-html2canvas-ignore' */}
    <button 
      onClick={descargarPaseImagen} 
      className="btn-oscuro"
      data-html2canvas-ignore="true" 
    >
      📥 Guardar Pase en Galería
    </button>
  </div>
</div>
      </div>
    );
  }

  // 🌸 RENDER 3: VISTA POR DEFECTO (Invitación con fotos y botones)
  return (
    <>
      {/* 🌀 OVERLAY INTERMEDIO DE CARGA */}
      {generandoPase && (
        <div className="loader-gala-overlay">
          <div className="spinner-gala" />
          <span className="subtitulo-caps" style={{ color: '#3b1b54', fontSize: '11px' }}>
            Generando Pase Digital
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', color: '#6d6d72', marginTop: '6px' }}>
            Preparando tu código de acceso...
          </span>
        </div>
      )}

      {/* Enviamos la nueva función 'activarFlujoPase' con el delay integrado */}
      <Invitacion datos={familia} integrantes={integrantes} onVerPase={activarFlujoPase} />
    </>
  );
}