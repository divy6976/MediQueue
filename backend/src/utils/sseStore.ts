
type Client = {
    res: any;
  };
  
  const clients: Record<string, Client[]> = {};
  
  export const addClient = (dept: string, res: any) => {
    if (!clients[dept]) clients[dept] = [];
    clients[dept].push({ res });
  };
  
  export const removeClient = (dept: string, res: any) => {
    clients[dept] = (clients[dept] || []).filter(
      (c) => c.res !== res
    );
  };
  
  export const broadcast = (dept: string, data: any) => {
    (clients[dept] || []).forEach((c) => {
      c.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  };