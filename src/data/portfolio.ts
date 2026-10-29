import curriculum from "./curriculum.json";

export const profile = curriculum.profile;
export const experiences = curriculum.experiences;
export const education = curriculum.education;
export const certifications = curriculum.certifications;
export const projects = curriculum.projects;
export const recommendation = {
  ...curriculum.recommendation,
  paragraphs: [
    "Tive o privilégio de trabalhar com Alexandre e posso afirmar que ele é um profissional exemplar, comprometido, competente e extremamente colaborativo.",
    "Possui uma visão técnica sólida, capacidade analítica apurada e grande facilidade para resolver problemas complexos com serenidade e foco em resultados.",
    "Além do domínio técnico, Alexandre se destaca pela postura ética, espírito de equipe e proatividade. Ele está sempre disposto a ajudar os colegas, compartilhar conhecimento e buscar as melhores soluções para o time e para o negócio.",
    "Sua atuação vai muito além da execução — Alexandre contribui com insights estratégicos, propõe melhorias contínuas e demonstra liderança natural, mesmo sem cargo formal de gestão.",
    "Sem dúvida, recomendo Alexandre com total confiança para qualquer empresa ou projeto que valorize profissionalismo, competência e comprometimento. Ele é daqueles talentos que elevam o nível do time por onde passam.",
  ],
};

export function formatMonth(value: string | null) {
  if (!value) return "atual";
  const [year, month] = value.split("-");
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${months[Number(month) - 1]} ${year}`;
}
