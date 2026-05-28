const { Schema, model } = require('mongoose');

const userSchema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
        },
        apellido: {
            type: String,
            required: true,
        },
        rut: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        telefono: {
            type: String,
            required: true,
        },
        profesion: {
            type: String,
            required: true,
            trim: true,
        },
        rol: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

module.exports = model('Usuario', userSchema);