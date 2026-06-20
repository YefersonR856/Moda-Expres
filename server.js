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

/** 
 * Middleware para la interceptación y parseo de peticiones con carga útil JSON.
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
 */
let inventario = [
    { id: 1, nombre: "Chaqueta Denim Premium", categoria: "Chaquetas", precio: 149900, stock: 15, talla: "M", color: "Azul Índigo" },
    { id: 2, nombre: "Pantalón Cargo Urbano", categoria: "Pantalones", precio: 119900, stock: 22, talla: "32", color: "Verde Militar" },
    { id: 3, nombre: "Camiseta Oversize Minimal", categoria: "Camisetas", precio: 69900, stock: 40, talla: "L", color: "Negro Mate" }
];

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
        id: inventario.length + 1,
        nombre: req.body.nombre,
        categoria: req.body.categoria,
        precio: parseFloat(req.body.precio),
        stock: parseInt(req.body.stock),
        talla: req.body.talla,
        color: req.body.color
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
    
    // Bucle iterativo de control de inventario (Descuento transaccional)
    carrito.forEach(item => {
        const producto = inventario.find(p => p.id === item.id);
        
        // Regla de negocio: Validar existencia del SKU y disponibilidad de existencias (Stock Control)
        if (producto && producto.stock >= item.cantidad) {
            producto.stock -= item.cantidad; // Deducción automatizada de unidades
        }
    });
    
    // Despacho de respuesta confirmando el estatus operativo de la transacción
    res.json({ estatus: "OK", mensaje: "¡Compra procesada con éxito y stock actualizado!" });
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