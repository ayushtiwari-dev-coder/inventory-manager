export const validateName = (name) => {
  if (!name || name.trim() === "") return "Name cannot be empty.";
  if (name.length > 25) return "Name too long.";
  if (!name.replace(/\s/g, "").match(/^[a-zA-Z0-9]+$/)) return "Name must contain only letters and numbers.";
  return null;
};

export const validateOrgName = (orgName) => {
  if (!orgName || orgName.trim() === "") return "Organization name cannot be empty.";
  if (orgName.length > 40) return "Organization name cannot exceed 40 characters.";
  if (!orgName.match(/^[a-zA-Z0-9\s-]+$/)) {
    return "Organization name can only contain letters, numbers, spaces, and dashes.";
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || email.trim() === "") return null;
  
  const cleanEmail = email.trim().toLowerCase();
  
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return "Invalid email syntax format. (e.g. user@domain.com)";
  }
  return null;
};

export const validateUsername = (username) => {
  const cleanUser = username ? username.trim().toLowerCase() : "";
  if (cleanUser === "") return "Username cannot be empty.";
  if (username.includes(" ")) return "Username cannot contain spaces.";
  if (cleanUser.length > 20) return "Username too long.";
  if (!cleanUser.replace(/_/g, "").replace(/-/g, "").match(/^[a-zA-Z0-9]+$/)) {
    return "Username can only contain letters, numbers, underscores, and dashes.";
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password cannot be empty.";
  if (password.length < 8) return "Password too short.";
  if (password.length > 32) return "Password too long.";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain a number.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain a special character.";
  if (password.includes(" ")) return "Password cannot contain spaces.";
  return null;
};

export const validateAuthInput = (view, fields) => {
  const { name, username, password } = fields;
  const usernameError = validateUsername(username);
  if (usernameError) return usernameError;
  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;
  if (view === 'register') {
    const nameError = validateName(name);
    if (nameError) return nameError;
  }
  return null;
};

export const validateWorkspaceInput = (mode, fields) => {
  if (mode === 'create') {
    const orgError = validateOrgName(fields.orgName);
    if (orgError) return orgError;
    
    const emailError = validateEmail(fields.ownerGmail);
    if (emailError) return emailError;
  } else if (mode === 'join') {
    if (!fields.joinCode || fields.joinCode.trim().length !== 6) {
      return "Join code must be exactly 6 characters long.";
    }
  }
  return null;
};
// src/utils/validators.js

export const validateProductInput = (mode, fields) => {
  const { name, sellingPrice, costPrice, stock } = fields;

  if (mode === 'add') {
    if (!name || name.trim() === "") {
      return "Product name cannot be empty.";
    }
    if (name.length > 40) {
      return "Product name cannot exceed 40 characters.";
    }

    const sPrice = parseFloat(sellingPrice);
    const cPrice = parseFloat(costPrice);
    const stockNum = parseInt(stock, 10);

    if (isNaN(cPrice) || cPrice <= 0) {
      return "Initial Cost price must be a valid number greater than zero.";
    }

    if (isNaN(sPrice) || sPrice < 0) {
      return "Initial Selling price cannot be negative (can be 0 for promotions).";
    }

    if (isNaN(stockNum) || stockNum < 0) {
      return "Initial stock quantity cannot be negative (enter 0 if you have no stock yet).";
    }

    return null;
  }

  if (mode === 'edit') {
    if (costPrice !== undefined && costPrice !== null && costPrice.toString().trim() !== "") {
      const cPrice = parseFloat(costPrice);
      if (isNaN(cPrice) || cPrice <= 0) {
        return "Updated Cost price must be strictly greater than zero.";
      }
    }

    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice.toString().trim() !== "") {
      const sPrice = parseFloat(sellingPrice);
      if (isNaN(sPrice) || sPrice < 0) {
        return "Updated Selling price cannot be negative (can be 0).";
      }
    }

    if (stock !== undefined && stock !== null && stock.toString().trim() !== "") {
      const stockNum = parseInt(stock, 10);
      if (isNaN(stockNum)) {
        return "Stock change must be a valid whole number integer.";
      }
    }

    return null;
  }

  return "Invalid validation mode provided.";
};