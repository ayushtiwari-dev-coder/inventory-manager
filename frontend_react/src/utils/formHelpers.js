export const INITIAL_AUTH_STATE = {
  name: '',
  username: '',
  password: '',
  masterCode: ''
};

export const INITIAL_WORKSPACE_STATE = {
  orgName: '',
  ownerGmail: '',
  joinCode: ''
};

export const INITIAL_PRODUCT_STATE = {
  name: '',
  sellingPrice: '',
  costPrice: '',
  stock:''
};

export const clearFormInputs = (setFormState, blueprint) => {
  setFormState({ ...blueprint });
};