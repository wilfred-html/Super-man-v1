window.antml = {
  invoke: async (functionName, params) => {
    const baseId = params.baseId;
    const apiKey = 'patWIccg6g6M6RUeN.3335205e114ef1f17aec15b16ca10146602f2b01d240da007e8cc4bf89a4937e';
    
    // Function to call Airtable API
    const callAirtable = async (endpoint, method = 'GET', data = null) => {
      const url = `https://api.airtable.com/v0/${baseId}/${endpoint}`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
      };
      
      const response = await fetch(url, options);
      return response.json();
    };
    
    // Map our functions to Airtable API calls
    switch (functionName) {
      case 'list_records':
        return callAirtable(`${params.tableId}`);
      
      case 'search_records':
        const records = await callAirtable(`${params.tableId}`);
        const searchTerm = params.searchTerm.toLowerCase();
        records.records = records.records.filter(record => {
          return Object.values(record.fields).some(value => {
            if (typeof value === 'string') return value.toLowerCase().includes(searchTerm);
            if (Array.isArray(value)) return value.some(v => v && v.toString().toLowerCase().includes(searchTerm));
            return false;
          });
        });
        return records;
      
      case 'create_record':
        return callAirtable(`${params.tableId}`, 'POST', { fields: params.fields });
      
      case 'update_records':
        const updates = params.records.map(record => ({
          id: record.id,
          fields: record.fields
        }));
        return callAirtable(`${params.tableId}`, 'PATCH', { records: updates });
      
      case 'delete_records':
        const ids = params.recordIds.join(',');
        return callAirtable(`${params.tableId}?records=${ids}`, 'DELETE');
      
      default:
        throw new Error(`Function ${functionName} not implemented`);
    }
  }
};

export default window.antml;