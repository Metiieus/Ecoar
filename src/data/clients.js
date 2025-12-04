// Clients configuration - scalable for multiple customers
export const clients = [
  {
    id: 'estanplaza',
    name: 'Estanplaza International',
    logo: 'E',
    establishments: [
      {
        id: 1,
        name: 'Matriz - São Paulo',
        abbreviation: 'SP'
      },
      {
        id: 2,
        name: 'Filial - Rio de Janeiro',
        abbreviation: 'RJ'
      },
      {
        id: 3,
        name: 'Filial - Belo Horizonte',
        abbreviation: 'BH'
      }
    ]
  },
  // Add more clients here as needed
  // {
  //   id: 'client2',
  //   name: 'Another Client',
  //   logo: 'AC',
  //   establishments: [...]
  // }
];

export const getClientById = (clientId) => {
  return clients.find(client => client.id === clientId);
};

export const getDefaultClient = () => {
  return clients[0]; // Returns first client as default
};

export const getClientByName = (name) => {
  return clients.find(client => client.name.toLowerCase() === name.toLowerCase());
};
