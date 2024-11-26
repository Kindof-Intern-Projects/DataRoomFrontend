// todo : put API in to env!!!!!!!!!!!
// todo : env 에 API 들 넣을것!!!!
const wpUrl = process.env.REACT_APP_WP_URL;
export const loginApi = async (username, password) => {
  const response = await fetch(wpUrl+"/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${error.message}`);
  }

  return response.json();
};

export const signUpApi = async (username, email, password) => {
  try {
    const response = await fetch(wpUrl+"/wp-json/wp/v2/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username, 
        email,    
        password, 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.message || `Sign-up failed with status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error during sign-up:", error);
    throw error;
  }
};
