# 🎮 Modelos 3D para Mario Party (GLTF / GLB)

El sistema soporta carga automática de modelos 3D en formato `.glb` o `.gltf` mediante `Three.js GLTFLoader`.

## Nombres esperados de archivos:
Coloca tus modelos `.glb` en esta carpeta con los siguientes nombres exactos:
- `mario.glb`
- `luigi.glb`
- `peach.glb`
- `yoshi.glb`
- `bowser.glb`
- `toad.glb`

## Comportamiento automático:
1. Si el archivo `.glb` existe en esta carpeta, el motor lo carga automáticamente, ajusta su escala y sombras, y lo monta sobre la casilla del jugador.
2. Si el archivo no existe, el motor utiliza los **modelos 3D procedurales volumétricos de alta fidelidad integrados** (con sus gorras, bigotes, vestidos, coronas, hocicos y caparazones esculpidos en Three.js).

## Dónde conseguir modelos gratuitos:
- [The Models Resource (Nintendo Switch / Mario Party)](https://www.models-resource.com/nintendo_switch/supermarioparty/)
- [Sketchfab (Low-poly Mario Party models en GLB)](https://sketchfab.com/search?q=mario+party&type=models)
