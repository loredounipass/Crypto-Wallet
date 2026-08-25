module.exports = {


    // DETIENE LA EJECUCION DEL PROCESO ACTUAL DURANTE LA CANTIDAD DE MILISEGUNDOS INDICADA
    sleep: (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))
}