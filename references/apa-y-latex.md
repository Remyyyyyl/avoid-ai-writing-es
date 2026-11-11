# Protegido: registro académico APA 7 y LaTeX

Este archivo es la lista de *must-not-fire*. Nada de lo aquí enumerado es un
IA-ismo y no debe "corregirse". Aplica a documentos académicos en español,
tesis, capítulos, artículos y cualquier archivo `.tex` con citas APA 7.

## 1. Registro académico legítimo (no tocar)

- Tercera persona e impersonal: "se realizaron las entrevistas", "se definieron los controles", "se evidencia".
- Fórmulas del género: "el presente documento", "la presente investigación", "el presente proyecto", "en esta etapa".
- Hedging científico: "los resultados sugieren", "podría deberse a", "la evidencia apunta a", "en principio".
- Nominalización técnica: "la priorización de pacientes", "la valoración de amenazas", "el registro de auditoría".
- Pasiva perifrástica y pasiva refleja cuando el actor no importa.
- Conectores formales: "sin embargo", "no obstante", "asimismo", "en efecto", "ahora bien", "en síntesis", "por consiguiente", "dado que", "puesto que", "a continuación", "de igual manera". Las plantillas APA 7 los admiten como variedad de conectores.
- Oraciones largas con subordinación, propias del español académico, mientras sean claras.
- Repetición del término técnico exacto en lugar de sinónimos (es lo deseable, no un defecto).

## 2. Citas y referencias APA 7 (nunca modificar el contenido)

- Citas parentéticas y narrativas: `(Rodríguez-Páez et al., 2018)`, `Kwon et al. (2018)`, `(Colombia. Congreso de la República, 2012)`.
- `et al.`, `s.f.`, `p.`/`pp.`, `párr.`, `(…)` para omisiones, `citados por`.
- Entradas de `referencias.bib`: autores, años, títulos, DOI, URL. No se "mejoran", no se completan de memoria, no se traducen.
- Comunicaciones personales y material legal con autor corporativo (`Colombia. Ministerio de Salud y Protección Social, 2015`).
- Cifras, porcentajes, tamaños de muestra, puertos, versiones y fechas: se conservan exactos. Si un número parece dudoso, se pregunta; no se redondea ni se cambia.

## 3. Convenciones APA 7 que no se "embellecen"

- Comillas inglesas (“…”) y sencillas (‘…’) preferidas sobre «latinas», salvo que la plantilla institucional pida otra cosa.
- Cursivas y negritas moderadas; subrayado desaconsejado.
- Abreviaturas moderadas; se prefiere texto claro.
- Resumen con *Palabras clave* y *Abstract* con *Keywords* cuando la plantilla lo exija.
- Capítulos y subcapítulos numerados; tablas y figuras con número, título y nota de fuente cuando aplica.
- Conclusiones en presente, tercera persona impersonal, y tantas como objetivos, si la plantilla lo pide.

Estas son convenciones de género, no reglas universales. Si la plantilla de la
institución dice otra cosa, manda la plantilla.

## 4. LaTeX: qué no se edita

En archivos `.tex` solo se edita **prosa**. Quedan fuera de toda edición:

- Comandos y sus argumentos estructurales: `\cite{...}`, `\parencite{...}`, `\textcite{...}`, `\ref{...}`, `\label{...}`, `\autoref{...}`, `\includegraphics`, `\input`, `\include`, `\usepackage`, `\documentclass`.
- Entornos completos: `figure`, `table`, `tabular`, `tabularx`, `tikzpicture`, `equation`, `align`, `lstlisting`, `verbatim`, `thebibliography`.
- Matemáticas: `$...$`, `$$...$$`, `\[...\]`, `\(...\)`.
- Comentarios (`% ...`), salvo que el usuario pida revisarlos.
- Espacios y guiones tipográficos: `~`, `--`, `---`, `\ `, `\,`.
- Claves y literales técnicos: nombres de paquetes, rutas, variables de entorno, URLs, comandos de terminal. Van en `\texttt{}` y se dejan tal cual.
- El preámbulo completo.

Regla práctica: si un cambio puede romper la compilación o una referencia
cruzada, no se hace. Después de editar prosa en `.tex`, se recompila con
`latexmk -pdf` antes de dar el trabajo por terminado.

## 5. Datos y limitaciones que no se "embellecen"

- Si el texto dice que algo es un prototipo, se conserva "prototipo".
- Si dice que no hay una función implementada, no se convierte en "trabajo futuro" sin que el autor lo pida.
- Si una cifra es sintética, se mantiene la palabra "sintética".
- Si una afirmación necesita fuente, se marca `[requiere fuente]`; no se inventa la cita ni se borra la afirmación sin avisar.

## 6. Verificación en LaTeX

El validador de preservación de esta skill trabaja sobre Markdown. En `.tex`
la verificación es distinta:

1. Compilar con `latexmk -pdf` antes y después.
2. Revisar el diff de la prosa, no el de los comandos.
3. Comprobar que las referencias cruzadas y las citas siguen resolviendo.
4. Si el detector se usa sobre `.tex`, interpretar sus hallazgos solo como
   señales de prosa: enmascara comandos, matemáticas y entornos, pero no
   sustituye la compilación.
