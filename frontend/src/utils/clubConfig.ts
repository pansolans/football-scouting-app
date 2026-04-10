import { ClubConfig } from '../types';

export const clubConfigs: Record<string, ClubConfig> = {
  'Club Atlético Banfield': {
    primaryColor: '#0a5f1c',
    secondaryColor: '#0d7328',
    logo: 'https://logodownload.org/wp-content/uploads/2020/05/banfield-logo-0.png',
    name: 'CA Banfield'
  },
  'Boca Juniors': {
    primaryColor: '#003f7f',
    secondaryColor: '#ffd700',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Escudo_del_Club_Atl%C3%A9tico_Boca_Juniors.svg/1696px-Escudo_del_Club_Atl%C3%A9tico_Boca_Juniors.svg.png',
    name: 'Boca Juniors'
  },
  'Santa Fe Fútbol Club': {
    primaryColor: '#003f7f',
    secondaryColor: '#ffd700',
    logo: 'https://santafefc.do/wp-content/uploads/2021/08/logo_sf_footer_300x300-16.png',
    name: 'Santa Fe FC'
  },
  'Millonarios FC': {
    primaryColor: '#1a3a7a',
    secondaryColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Escudo_de_Millonarios_temporada_2003-2006.png',
    name: 'MFC'
  },
  'UAI Urquiza': {
    primaryColor: '#00668c',
    secondaryColor: '#780000',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9d/Club_dep_uaiurquiza_crest.png',
    name: 'UAI'
  },
  'TAGENCY': {
    primaryColor: '#121113',
    secondaryColor: '#f7b538',
    logo: 'https://i.imgur.com/0qe0Wxg.jpeg',
    name: 'TAGENCY'
  },
  'CA Colón': {
    primaryColor: '#00668c',
    secondaryColor: '#b6ccd8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Escudo_del_C._A._Col%C3%B3n.png',
    name: 'CA Colón'
  },
};

export const getClubConfig = (organization: string): ClubConfig => {
  return clubConfigs[organization] || clubConfigs['Club Atlético Banfield'];
};
