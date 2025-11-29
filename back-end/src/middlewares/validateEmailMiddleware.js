/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format"
    });
  }
  
  next();
};

/**
 * Validate password strength
 */
export const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters"
    });
  }
  
  next();
};

/**
 * Validate age range
 */
export const validateAge = (req, res, next) => {
  const { age } = req.body;

  if (age !== undefined) {
    const ageNum = parseInt(age);
    
    if (isNaN(ageNum)) {
      return res.status(400).json({
        success: false,
        message: "Age must be a number"
      });
    }

    if (ageNum < 1 || ageNum > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be between 1 and 120"
      });
    }
  }
  
  next();
};

/**
 * Validate gender enum value
 */
export const validateGender = (req, res, next) => {
  const { gender } = req.body;
  const validGenders = ['MALE', 'FEMALE', 'OTHER'];

  if (gender !== undefined && !validGenders.includes(gender)) {
    return res.status(400).json({
      success: false,
      message: `Gender must be one of: ${validGenders.join(', ')}`
    });
  }
  
  next();
};

/**
 * Validate PIN format (6 digits)
 */
export const validatePIN = (req, res, next) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({
      success: false,
      message: "PIN is required"
    });
  }

  const pinRegex = /^\d{6}$/;
  if (!pinRegex.test(pin)) {
    return res.status(400).json({
      success: false,
      message: "PIN must be exactly 6 digits"
    });
  }
  
  next();
};