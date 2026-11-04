# @blocksy/element-language

The Language element: the lang editor. It lists every translation key the project makes
(names, tab titles, tooltip lines) next to its English text, and holds the translations for
one language (`de_de`, `fr_fr`, ...). A Language for `en_us` overrides or adds English text.
Loader code lives in each target (Fabric writes `assets/<modid>/lang/<locale>.json`).
