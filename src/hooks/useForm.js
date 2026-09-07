import { useState } from 'react';

/**
 * Custom hook to manage form state, changes, reset, and errors.
 * @param {Object} initialValues - Initial form values.
 * @param {Function} validate - Validation function.
 */
export const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Support radio buttons, checkboxes, and text/number inputs
    const inputValue = type === 'checkbox' ? checked : value;
    
    setValues({
      ...values,
      [name]: inputValue,
    });

    // Clear validation error for this field as the user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleReset = (e) => {
    if (e) e.preventDefault();
    setValues(initialValues);
    setErrors({});
    console.log("Formulario reiniciado (Estado limpiado)");
  };

  const validateForm = () => {
    if (!validate) return true;
    const formErrors = validate(values);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  return {
    values,
    errors,
    handleChange,
    handleReset,
    validateForm,
    setErrors,
    setValues,
  };
};
