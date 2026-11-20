export const specialties = [
  "Clínica Geral",
  "Cardiologia",
  "Pediatria",
  "Nutrição",
  "Fonoaudiologia",
  "Dermatologia",
  "Psicologia",
];

export const services = [
  [0, "Consulta de clínica geral", 30, 15000],
  [0, "Retorno de clínica geral", 30, 9000],
  [1, "Consulta de cardiologia", 45, 23000],
  [1, "Retorno de cardiologia", 30, 14000],
  [2, "Consulta de pediatria", 30, 17000],
  [2, "Retorno de pediatria", 30, 10000],
  [3, "Consulta de nutrição", 60, 18000],
  [3, "Retorno de nutrição", 30, 11000],
  [4, "Consulta de fonoaudiologia", 45, 16000],
  [5, "Consulta de dermatologia", 30, 22000],
  [6, "Consulta de psicologia", 50, 18000],
  [6, "Retorno de psicologia", 50, 15000],
] as const;

export const professionals = [
  "Helena Monteiro",
  "Bruno Noronha",
  "Lívia Amaral",
  "Marcos Prado",
  "Renata Azevedo",
  "Caio Figueira",
];

const firstNames = [
  "Ana",
  "Breno",
  "Camila",
  "Daniel",
  "Eva",
  "Felipe",
  "Giovana",
  "Hugo",
];
const surnames = ["Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves"];
export const patientNames = surnames.flatMap((surname) =>
  firstNames.map((name) => `${name} ${surname}`),
);
