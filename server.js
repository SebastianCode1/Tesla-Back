const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de CORS
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Middleware para pasar io a los controladores
app.use((req, res, next) => {
  req.io = io;
  
  // Función para crear notificaciones desde cualquier controlador
  req.createNotification = async (notificationData) => {
    try {
      const Notification = require('./models/Notification');
      const notification = await Notification.create(notificationData);
      
      // Emitir evento de Socket.IO
      io.to(notificationData.userId.toString()).emit('newNotification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return null;
    }
  };
  
  next();
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Unir al socket a una sala con el ID del usuario
  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);
    console.log(`Usuario ${userId} unido a su sala`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/report-templates', require('./routes/reportTemplates'));
app.use('/api/maintenances', require('./routes/maintenances'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/notifications', require('./routes/notifications'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API Tesla Lift funcionando');
});

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5001; // Changed default port to 5001

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Cerrar servidor y salir
  server.close(() => process.exit(1));
});