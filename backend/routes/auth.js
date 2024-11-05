const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const validate = require("../middleware/validationMiddleware");
const authenticate = require("../middleware/authenticate");
const Joi = require("joi");
const logger = require("../config/logger");
const jsforce = require("jsforce");

// Define the validation schema
const registrationSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "nameRequired",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "emailNotValid",
    "string.empty": "emailRequired",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "passwordLength",
    "string.empty": "passwordRequired",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "emailNotValid",
    "string.empty": "emailRequired",
  }),
  password: Joi.string().required().messages({
    "string.empty": "passwordRequired",
  }),
});

// Register a new user
router.post(
  "/register",
  validate(registrationSchema),
  async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ message: "emailInUse" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

// Login a user
router.post("/login", validate(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "wrongCredentials" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "userBlocked" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "wrongCredentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        theme: user.theme,
        language: user.language,
        salesforceAccountId: user.salesforceAccountId,
        salesforceContactId: user.salesforceContactId,
      },
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isBlocked: true,
        language: true,
        theme: true,
        salesforceAccountId: true,
        salesforceContactId: true,
      },
    });

    res.json({ user });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Nueva ruta para sincronizar con Salesforce
router.post("/salesforce/sync", authenticate, async (req, res, next) => {
  const { name, email, lastName } = req.body;

  try {
    // Conexión a Salesforce
    const conn = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_LOGIN_URL,
    });

    await conn.login(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
    );

    // Buscar una Cuenta existente por nombre
    let account = await conn.sobject("Account").findOne({ Name: name }, ["Id"]);

    // Si no existe la Cuenta, crear una nueva
    if (!account) {
      const accountResult = await conn.sobject("Account").create({
        Name: name,
      });

      if (accountResult.success) {
        account = { Id: accountResult.id };
      } else {
        throw new Error(
          "Error al crear la Cuenta en Salesforce: " +
            accountResult.errors.join(", ")
        );
      }
    }

    // Buscar un Contacto existente por email
    let contact = await conn
      .sobject("Contact")
      .findOne({ Email: email }, ["Id"]);

    // Si no existe el Contacto, crear uno nuevo
    if (!contact) {
      const contactResult = await conn.sobject("Contact").create({
        FirstName: name,
        LastName: lastName,
        Email: email,
        AccountId: account.Id,
      });

      if (contactResult.success) {
        contact = { Id: contactResult.id };
      } else {
        throw new Error(
          "Error al crear el Contacto en Salesforce: " +
            contactResult.errors.join(", ")
        );
      }
    }

    // Actualizar el usuario en la base de datos con los IDs de Salesforce
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        salesforceAccountId: account.Id,
        salesforceContactId: contact.Id,
      },
    });

    res.json({
      message: "Sincronización con Salesforce exitosa",
      salesforceAccountId: account.Id,
      salesforceContactId: contact.Id,
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Nueva ruta para desconectar de Salesforce
router.post("/salesforce/disconnect", authenticate, async (req, res, next) => {
  try {
    // Actualizar el usuario en la base de datos
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        salesforceAccountId: null,
        salesforceContactId: null,
      },
    });
    res.json({ message: "Desconectado de Salesforce exitosamente" });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
