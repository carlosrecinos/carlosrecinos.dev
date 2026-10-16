Quiero que mi Claude Code tenga una mascota con vida propia: un personajito de pixel art que vive pegadito al prompt y
reacciona a lo que pasa en la sesión. Construila e instalala vos, de punta a punta, y probala antes de decirme que está
lista. Todo en español.

## Qué tiene que hacer

1. **Trabaja cuando vos trabajás.** Mientras respondés, la mascota hace lo mismo que vos, con utilería en la mano:
   - leyendo archivos → un libro
   - buscando en internet → un globo terráqueo
   - corriendo comandos → una compu
   - escribiendo o editando código → un lápiz
   - pensando → una nubecita con puntos
   - delegando a subagentes → aparecen mascotas mini a la par, una por subagente, cada una con su utilería
   - al terminar → celebra un momento («¡listo!»)
2. **Se duerme.** A los 3 minutos sin actividad se acuesta y le salen zzz.
3. **Se va.** A los 30 minutos sin que yo le escriba: se estira, clava un rótulo que dice «AHORITA VENGO», cuelga su
   sombrero en el rótulo y se va caminando con su atado al hombro.
4. **Manda postales.** Mientras no vuelvo, cada tanto llega una postal de dónde anda, con su dibujito y su nombre:
   comiendo pupusas, en la playa de El Tunco, subiendo el volcán, pescando en Coatepeque. A ratos se asoma por la orilla
   a ver si ya volví, pasan cardos rodando y al rótulo le va creciendo una telaraña.
5. **Vuelve.** Cuando le escribo, regresa y me avisa de dónde viene y cuánto rato lo dejé solo, por ejemplo:
   «¡Tu Claude volvió de la playa! · estuviste fuera 34 min».
6. **Se viste según el modelo.** Opus con corona, Sonnet con boina y pluma, Haiku con sombrero de paja; cualquier otro
   modelo, sin sombrero. Si cambio de modelo, me avisa con un mensajito.

## Cómo hacerla

- Antes de escoger cómo, revisá la documentación de tu versión de Claude Code y usá el mecanismo de extensión más
  sólido que soporte: un plugin con interfaz propia si existe; si no, la statusline más hooks. Decime cuál escogiste y
  por qué.
- Pixel art con caracteres de medio bloque (▀ ▄) y color de 24 bits, de unas 20 columnas de ancho, animado a pocos
  cuadros por segundo. Que no tape el prompt, que no haga parpadear la terminal y que no gaste tokens: la mascota se
  dibuja sola, sin llamar al modelo.
- Un comando `/mascota` para controlarla: `grande`, `mini`, `off` y `demo <estado>` (para ver cualquier estado sin
  esperar media hora).
- Los tiempos (3 y 30 min) y la lista de destinos de las postales, en un solo lugar y fáciles de cambiar.
- Que sobreviva a reiniciar Claude Code y que no rompa nada si algo falla: ante un error, la mascota desaparece en
  silencio y Claude Code sigue igual.
- Mientras la probás, no toques mis otras sesiones ni terminales: si abrís una aparte (por ejemplo en tmux), que sea
  tuya y cerrá solo esa.

## Antes de decirme que está lista

1. Corré la demo de cada estado y mostrame cómo se ve.
2. Probala con tiempos cortos (por ejemplo, 10 s para dormirse y 30 s para irse): que se duerma, se vaya, mande una
   postal y vuelva con el aviso. Después dejá los tiempos reales.
3. Decime cómo apagarla y cómo desinstalarla.
