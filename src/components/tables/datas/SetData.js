import { useState, useEffect } from 'react';
import {fetchTable} from '../../../api/table/table';

// Define SetData as a constant function
const SetTable = (projectId) => {
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchTable(projectId);  // Fetch data with the projectId
        setData(result);
      } catch (error) {
        setError(error.message);  // Set error if there's an issue
      } finally {
        setLoading(false);  // Set loading to false once data is fetched
      }
    };

    getData();  // Invoke the fetch function
  }, [projectId]);  // Re-fetch data if projectId changes

  // You can return or handle the data without JSX here
  return {
    data
  };
};

export default SetTable;
