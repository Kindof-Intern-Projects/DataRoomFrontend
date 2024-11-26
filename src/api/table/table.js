const BACKEND_URL = process.env.REACT_APP_BACK_URL;
export const fetchTable = async (projectId) => {
    try {
      const response = await fetch(BACKEND_URL+`/sheet/projects/${projectId}`);
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };
  