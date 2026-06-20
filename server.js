/**
 * @file server.js
 * @description Servidor de backend y API RESTful para la gestión del ecosistema "Moda Express".
 * @author Yeferson Stiven Murcia Romero
 * @version 2.0.0 (V-02: Persistencia en Memoria y Middleware de Liquidación de Stock)
 * @framework Express.js / Node.js Runtime Environment
 * @lifecycle Orquestador del backend encargado del ruteo estático y operaciones CRUD (GA7-220501096-AA3-EV01).
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// =====================================================================
// CONFIGURACIÓN DE MIDDLEWARES ARQUITECTÓNICOS
// =====================================================================

/** * Middleware para la interceptación y parseo de peticiones con carga útil JSON.
 * Permite la lectura estructurada del objeto 'req.body'.
 */
app.use(express.json());

/**
 * Middleware de despacho estático.
 * Sirve de manera pública los recursos del Frontend (HTML, CSS, JS) alojados en la carpeta raíz 'public'.
 */
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
// PERSISTENCIA DE DATOS SIMULADA (Mesa de Datos en Memoria Volátil)
// =====================================================================

/**
 * @typedef {Object} Producto
 * @property {number} id - Identificador único incremental.
 * @property {string} nombre - Descriptor comercial de la prenda.
 * @property {string} categoria - Clasificación de catálogo (Chaquetas, Pantalones, etc.).
 * @property {number} precio - Valor monetario de liquidación en pesos colombianos (COP).
 * @property {number} stock - Unidades físicas disponibles en bodega.
 * @property {string} talla - Métrica dimensional del producto.
 * @property {string} color - Atributo cromático de la prenda.
 * @property {string} imagen - URL de recurso gráfico estático del producto.
 */
let inventario = [
    { id: 1, nombre: "Chaqueta Denim Premium", categoria: "Chaquetas", precio: 149900, stock: 15, talla: "M", color: "Azul Índigo", imagen: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=500" },
    { id: 2, nombre: "Pantalón Cargo Urbano", categoria: "Pantalones", precio: 119900, stock: 22, talla: "32", color: "Verde Militar", imagen: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=500" },
    { id: 3, nombre: "Camiseta Oversize Minimal", categoria: "Camisetas", precio: 69900, stock: 40, talla: "L", color: "Negro Mate", imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=500" }
];

/**
 * Colección indexada para el almacenamiento persistente simulado de órdenes de compra recibidas.
 */
let ordenes = [];

// =====================================================================
// DEFINICIÓN DE ENDPOINTS DE LA API (RESTful Routing)
// =====================================================================

/**
 * @route GET /api/productos
 * @description Obtiene la colección completa del inventario actual para la vitrina virtual.
 * @access Público
 */
app.get('/api/productos', (req, res) => {
    res.json(inventario);
});

/**
 * @route POST /api/productos
 * @description Registra un nuevo ítem en la base de datos distribuida desde el panel administrativo.
 * @access Restringido / Administrador
 */
app.post('/api/productos', (req, res) => {
    // Estructuración del nuevo objeto de producto con casting explícito de datos numéricos
    const nuevoProducto = {
        id: inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1,
        nombre: req.body.nombre,
        categoria: req.body.categoria,
        precio: parseFloat(req.body.precio),
        stock: parseInt(req.body.stock),
        talla: req.body.talla,
        color: req.body.color,
        imagen: req.body.imagen || "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=500" // Imagen elegante genérica si no se provee una
    };
    
    // Inserción en el almacén de datos global
    inventario.push(nuevoProducto);
    
    // Respuesta HTTP 201 Created confirmando el registro exitoso
    res.status(201).json({ mensaje: "Prenda registrada con éxito", producto: nuevoProducto });
});

/**
 * @route POST /api/comprar
 * @description Simula el proceso de checkout, validando y decrementando el stock físico disponible.
 * @access Público (Pasarela de Pago Simulada)
 */
app.post('/api/comprar', (req, res) => {
    const carrito = req.body.carrito; // Colección de identificadores y cantidades a liquidar
    
    // Regla de validación inicial: Comprobar existencia de la carga útil
    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ estatus: "ERROR", mensaje: "El carrito se encuentra vacío de manera estructural." });
    }

    // Primera fase de control: Verificar disponibilidad integral antes de realizar mutaciones de datos
    for (const item of carrito) {
        const producto = inventario.find(p => p.id === item.id);
        if (!producto) {
            return res.status(404).json({ estatus: "ERROR", mensaje: `El producto con ID ${item.id} no existe en el catálogo.` });
        }
        if (producto.stock < item.cantidad) {
            return res.status(400).json({ 
                estatus: "ERROR", 
                mensaje: `Existencias insuficientes para la prenda: ${producto.nombre}. Disponibles: ${producto.stock} unidades.` 
            });
        }
    }

    // Segunda fase de control: Deducción automatizada y transaccional del stock físico
    carrito.forEach(item => {
        const producto = inventario.find(p => p.id === item.id);
        if (producto) {
            producto.stock -= item.cantidad; 
        }
    });

    // Registro histórico de la orden dentro del sistema distribuido en memoria
    const nuevaOrden = {
        id: ordenes.length + 1,
        items: carrito,
        fecha: new Date()
    };
    ordenes.push(nuevaOrden);
    
    // Despacho de respuesta confirmando el estatus operativo de la transacción
    res.json({ estatus: "OK", mensaje: "¡Compra procesada con éxito y stock actualizado!", inventario: inventario });
});

/**
 * @route DELETE /api/productos/:id
 * @description Remueve de forma lógica y física un ítem del almacén de inventario por su ID.
 * @access Restringido / Administrador
 */
app.delete('/api/productos/:id', (req, res) => {
    const idProducto = parseInt(req.params.id);
    const longitudInicial = inventario.length;
    
    inventario = inventario.filter(p => p.id !== idProducto);
    
    if (inventario.length < longitudInicial) {
        res.status(200).json({ estatus: "OK", mensaje: `Producto con ID #${idProducto} removido del catálogo de bodega.` });
    } else {
        res.status(404).json({ estatus: "ERROR", mensaje: "El ID especificado no coincide con ningún producto activo." });
    }
});

/**
 * @route DELETE /api/ordenes/:id
 * @description Elimina o cancela un registro de orden de compra histórica del sistema por su ID.
 * @access Restringido / Administrador
 */
app.delete('/api/ordenes/:id', (req, res) => {
    const idOrden = parseInt(req.params.id);
    const longitudInicial = ordenes.length;
    
    ordenes = ordenes.filter(o => o.id !== idOrden);
    
    if (ordenes.length < longitudInicial) {
        res.status(200).json({ estatus: "OK", mensaje: `Orden de facturación #${idOrden} cancelada y retirada con éxito.` });
    } else {
        res.status(404).json({ estatus: "ERROR", mensaje: "La orden referenciada no existe dentro de los históricos." });
    }
});

// =====================================================================
// INICIALIZACIÓN DEL SERVICIO (Bootstrap)
// =====================================================================

/**
 * Lanza el listener del servidor de red en el puerto configurado de alta disponibilidad.
 */
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SERVIDOR CORRIENDO EXITOSAMENTE`);
    console.log(`📱 Módulo Cliente (Inicio): http://localhost:${PORT}`);
    console.log(`⚙️  Módulo Administración: http://localhost:${PORT}/admin.html`);
    console.log(`====================================================`);
});