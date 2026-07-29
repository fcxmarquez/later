import { MediaDetail, MediaItem } from "./types";

export const imageUrl = (
  path: string,
  size: "poster" | "backdrop" | "profile" | "logo" = "poster",
) => {
  if (path.startsWith("http")) return path;
  const sizeMap = {
    poster: "w500",
    backdrop: "original",
    profile: "w185",
    logo: "w154",
  } as const;
  return `https://image.tmdb.org/t/p/${sizeMap[size]}${path}`;
};

export const featured: MediaItem = {
  id: 157336,
  title: "Interstellar",
  overview:
    "Un grupo de exploradores hacen uso de un agujero de gusano recientemente descubierto para superar las limitaciones de los viajes espaciales tripulados y vencer las inmensas distancias que tiene un viaje interestelar.",
  posterPath: "/d1QKiYtceF3GDtxvTFXFAqwwah9.jpg",
  backdropPath: "/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg",
  mediaType: "movie",
  year: "2014",
  rating: 8.5,
  genres: ["Aventura", "Drama", "Ciencia ficción"],
};

/** Demo-enriched details for offline/guest mode without TMDB token. */
const demoDetails: Record<string, MediaDetail> = {
  "movie-157336": {
    id: 157336,
    title: "Interstellar",
    overview:
      "Un grupo de exploradores hacen uso de un agujero de gusano recientemente descubierto para superar las limitaciones de los viajes espaciales tripulados y vencer las inmensas distancias que tiene un viaje interestelar.",
    posterPath: "/d1QKiYtceF3GDtxvTFXFAqwwah9.jpg",
    backdropPath: "/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg",
    mediaType: "movie",
    year: "2014",
    rating: 8.5,
    genres: ["Aventura", "Drama", "Ciencia ficción"],
    tagline:
      "La humanidad nació en la Tierra. Nunca estuvo destinada a morir aquí.",
    runtime: 169,
    status: "Released",
    director: "Christopher Nolan",
    cast: [
      {
        id: 10297,
        name: "Matthew McConaughey",
        character: "Cooper",
        profilePath: "/lCySuYjhXix3FzQdS4oceDDrXKI.jpg",
      },
      {
        id: 1813,
        name: "Anne Hathaway",
        character: "Brand",
        profilePath: "/nbccV2pMoyLTCeg5DQip24Eq0Jp.jpg",
      },
      {
        id: 3895,
        name: "Michael Caine",
        character: "Professor Brand",
        profilePath: "/bVZRMlpjTAO2pJK6v90buFgVbSW.jpg",
      },
      {
        id: 83002,
        name: "Jessica Chastain",
        character: "Murph",
        profilePath: "/eQKnihReJeB9vQEa5gySzAlKfZt.jpg",
      },
      {
        id: 1893,
        name: "Casey Affleck",
        character: "Tom",
        profilePath: "/304ilSygaCRWykoBWAL67TOw8g9.jpg",
      },
      {
        id: 8210,
        name: "Wes Bentley",
        character: "Doyle",
        profilePath: "/voD93lzFZrr9xfAggwFcPRBi84i.jpg",
      },
      {
        id: 17052,
        name: "Topher Grace",
        character: "Getty",
        profilePath: "/oJQxl4DG0KSCtOGrpWNhYz9gUZA.jpg",
      },
      {
        id: 851784,
        name: "Mackenzie Foy",
        character: "Murph (10 Yrs.)",
        profilePath: "/wzH60SrqWp2XMkBfLgdBhx5EJ82.jpg",
      },
    ],
    providers: [
      {
        id: 119,
        name: "Amazon Prime Video",
        logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
      },
      {
        id: 149,
        name: "Movistar Plus+ Ficción Total",
        logoPath: "/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 2100,
        name: "Amazon Prime Video with Ads",
        logoPath: "/8aBqoNeGGr0oSA85iopgNZUOTOc.jpg",
      },
      {
        id: 1825,
        name: "HBO Max Amazon Channel",
        logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg",
      },
      {
        id: 2,
        name: "Apple TV Store",
        logoPath: "/SPnB1qiCkYfirS2it3hZORwGVn.jpg",
      },
    ],
  },
  "tv-1399": {
    id: 1399,
    title: "Juego de tronos",
    overview:
      "En una tierra donde los veranos duran décadas y los inviernos pueden durar toda una vida, los problemas acechan. Desde las maquinaciones del sur a las salvajes tierras del este, pasando por el helado norte y el milenario muro que protege el reino de las fuerzas tenebrosas, dos poderosas familias mantienen un enfrentamiento letal por gobernar los Siete Reinos de Poniente. Mientras la traición, la lujuria y las fuerzas sobrenaturales sacuden los pilares de los reinos, la sangrienta batalla por el trono de Hierro tendrá consecuencias imprevistas y trascendentales. El invierno se acerca. Que empiece 'Juego de tronos'.",
    posterPath: "/3hDtRuwTfQQYRst3kjhvp4Cogjw.jpg",
    backdropPath: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
    mediaType: "tv",
    year: "2011",
    rating: 8.5,
    genres: ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
    tagline: "Se acerca el invierno",
    runtime: null,
    seasons: 8,
    status: "Ended",
    creators: ["David Benioff", "D. B. Weiss"],
    cast: [
      {
        id: 22970,
        name: "Peter Dinklage",
        character: "Tyrion 'The Halfman' Lannister",
        profilePath: "/9CAd7wr8QZyIN0E7nm8v1B6WkGn.jpg",
      },
      {
        id: 239019,
        name: "Kit Harington",
        character: "Jon Snow",
        profilePath: "/iGXlJbExWwZmo9sUDsYuzf4Sv4y.jpg",
      },
      {
        id: 12795,
        name: "Nikolaj Coster-Waldau",
        character: "Sir Jaime 'Kingslayer' Lannister",
        profilePath: "/rpFOERbHkj7GWxkinUNiQ76sSGk.jpg",
      },
      {
        id: 17286,
        name: "Lena Headey",
        character: "Cersei Lannister",
        profilePath: "/cDyZLf8ddz0EgoUjpv4jjzy7qxA.jpg",
      },
      {
        id: 1223786,
        name: "Emilia Clarke",
        character: "Daenerys Targaryen",
        profilePath: "/iFY6t7Ux9r70WB7Sp0TTVz6eGtm.jpg",
      },
      {
        id: 15498,
        name: "Liam Cunningham",
        character: "Davos Seaworth",
        profilePath: "/ljmFT9zYqh4k2bmEcNU6rxoE7fW.jpg",
      },
      {
        id: 1181313,
        name: "Maisie Williams",
        character: "Arya Stark",
        profilePath: "/5RjD4dDpRDAhalFtvcUj7zdLWYB.jpg",
      },
      {
        id: 239020,
        name: "Isaac Hempstead Wright",
        character: "Brandon 'Bran' Stark",
        profilePath: "/g6ZreLmGrrOzaUCGVFRNPAWfcso.jpg",
      },
    ],
    providers: [
      {
        id: 149,
        name: "Movistar Plus+ Ficción Total",
        logoPath: "/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 1825,
        name: "HBO Max Amazon Channel",
        logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg",
      },
      {
        id: 10,
        name: "Amazon Video",
        logoPath: "/qR6FKvnPBx2O37FDg8PNM7efwF3.jpg",
      },
    ],
  },
  "tv-66732": {
    id: 66732,
    title: "Stranger Things",
    overview:
      "A raíz de la desaparición de un niño, un pueblo desvela un misterio relacionado con experimentos secretos, fuerzas sobrenaturales aterradoras y una niña muy extraña.",
    posterPath: "/1sRJ8D1vpXE5WQBGrUBky3uUwvX.jpg",
    backdropPath: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    mediaType: "tv",
    year: "2016",
    rating: 8.6,
    genres: ["Action & Adventure", "Misterio", "Sci-Fi & Fantasy"],
    tagline: "Un verano puede cambiarlo todo.",
    runtime: null,
    seasons: 5,
    status: "Ended",
    creators: ["Ross Duffer", "Matt Duffer"],
    cast: [
      {
        id: 1920,
        name: "Winona Ryder",
        character: "Joyce Byers",
        profilePath: "/8RVrlgtua8b53wmK7oZAAkm0N5O.jpg",
      },
      {
        id: 35029,
        name: "David Harbour",
        character: "Jim Hopper",
        profilePath: "/qMFtMWlYVtFVyBoBhX5IoA5sN5a.jpg",
      },
      {
        id: 1356210,
        name: "Millie Bobby Brown",
        character: "Eleven / Jane Hopper",
        profilePath: "/k9KGzGDVhXKfOGpoN62MNuXL28q.jpg",
      },
      {
        id: 1442069,
        name: "Finn Wolfhard",
        character: "Mike Wheeler",
        profilePath: "/vgjd34eWfVL6GsLHwiwcAsjWLmo.jpg",
      },
      {
        id: 1653291,
        name: "Gaten Matarazzo",
        character: "Dustin Henderson",
        profilePath: "/qOwnmR5gbOT6ygp17YyLlEKXD38.jpg",
      },
      {
        id: 1474123,
        name: "Caleb McLaughlin",
        character: "Lucas Sinclair",
        profilePath: "/4jVS3EziBn7bf97ErxkW7jsdiLM.jpg",
      },
      {
        id: 1393177,
        name: "Noah Schnapp",
        character: "Will Byers",
        profilePath: "/f8Gk3MUuz3xDNtcaErYB2RLgyPO.jpg",
      },
      {
        id: 1590797,
        name: "Sadie Sink",
        character: "Max Mayfield",
        profilePath: "/fV0KHJcK3fYX2acMorDUf1Uv9mY.jpg",
      },
    ],
    providers: [
      {
        id: 8,
        name: "Netflix",
        logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
      },
      {
        id: 1796,
        name: "Netflix Standard with Ads",
        logoPath: "/dpR8r13zWDeUR0QkzWidrdMxa56.jpg",
      },
    ],
  },
  "movie-693134": {
    id: 693134,
    title: "Dune: Parte dos",
    overview:
      "Sigue el viaje mítico de Paul Atreides mientras se une a Chani y los Fremen en una guerra de venganza contra los conspiradores que destruyeron a su familia. Al enfrentarse a una elección entre el amor de su vida y el destino del universo conocido, Paul se esfuerza por evitar un futuro terrible que solo él puede prever.",
    posterPath: "/xCHmhHeO7aOCMlzcNukGH6Q7EiD.jpg",
    backdropPath: "/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    mediaType: "movie",
    year: "2024",
    rating: 8.1,
    genres: ["Ciencia ficción", "Aventura"],
    tagline: "Larga vida a los guerreros.",
    runtime: 167,
    status: "Released",
    director: "Denis Villeneuve",
    cast: [
      {
        id: 1190668,
        name: "Timothée Chalamet",
        character: "Paul Atreides",
        profilePath: "/axENiFIrSz5B7UuWkMT7PDe7CaO.jpg",
      },
      {
        id: 505710,
        name: "Zendaya",
        character: "Chani",
        profilePath: "/1qup8tSt95HLbcy2c2xrx4iJNxv.jpg",
      },
      {
        id: 933238,
        name: "Rebecca Ferguson",
        character: "Jessica",
        profilePath: "/ty8ZPzaCBBlqIr5qzpOXI24iC8j.jpg",
      },
      {
        id: 3810,
        name: "Javier Bardem",
        character: "Stilgar",
        profilePath: "/zfRID0jx8DKBluPGU9xtk9sZWUt.jpg",
      },
      {
        id: 16851,
        name: "Josh Brolin",
        character: "Gurney Halleck",
        profilePath: "/sX2etBbIkxRaCsATyw5ZpOVMPTD.jpg",
      },
      {
        id: 86654,
        name: "Austin Butler",
        character: "Feyd-Rautha",
        profilePath: "/atdAs4pFGjUQ4m2W8kJYly7N6cC.jpg",
      },
      {
        id: 1373737,
        name: "Florence Pugh",
        character: "Princess Irulan",
        profilePath: "/1Uvfh7xL4U2evkhs0M3C7BbBYFf.jpg",
      },
      {
        id: 543530,
        name: "Dave Bautista",
        character: "Beast Rabban",
        profilePath: "/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg",
      },
    ],
    providers: [
      {
        id: 119,
        name: "Amazon Prime Video",
        logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 2100,
        name: "Amazon Prime Video with Ads",
        logoPath: "/8aBqoNeGGr0oSA85iopgNZUOTOc.jpg",
      },
      {
        id: 1825,
        name: "HBO Max Amazon Channel",
        logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg",
      },
      {
        id: 2,
        name: "Apple TV Store",
        logoPath: "/SPnB1qiCkYfirS2it3hZORwGVn.jpg",
      },
      {
        id: 35,
        name: "Rakuten TV",
        logoPath: "/bZvc9dXrXNly7cA0V4D9pR8yJwm.jpg",
      },
    ],
  },
  "tv-100088": {
    id: 100088,
    title: "The Last of Us",
    overview:
      "Año 2023, veinte años después del comienzo de una plaga mundial que infectó a población con un hongo mutado transformando a las personas en unas criaturas caníbales, el contrabandista Joel tiene la misión de escoltar a la adolescente Ellie por un mundo postapocalíptico en el nada va a ser fácil para los viajeros.  Joel todavía vive atormentado por el recuerdo de su única hija. Ellie es portadora de algo que podría cambiar el destino de la humanidad ¿Conseguirán sobrevivir los dos?",
    posterPath: "/tNQWO6cNzQYCyvw36mUcAQQyf5F.jpg",
    backdropPath: "/acevLdSl5I2MK5RYAm7gwAndt1w.jpg",
    mediaType: "tv",
    year: "2023",
    rating: 8.4,
    genres: ["Drama"],
    tagline: "Cuando estéis perdidos en la oscuridad, buscad la luz.",
    runtime: null,
    seasons: 2,
    status: "Returning Series",
    creators: ["Neil Druckmann", "Craig Mazin"],
    cast: [
      {
        id: 1668004,
        name: "Bella Ramsey",
        character: "Ellie Williams",
        profilePath: "/vDbgxc7RYawpB1wK7JDEj62j06H.jpg",
      },
      {
        id: 111016,
        name: "Gabriel Luna",
        character: "Tommy Miller",
        profilePath: "/bIPORtYxTJPEUJIThbZrpqf4A11.jpg",
      },
      {
        id: 1428070,
        name: "Isabela Merced",
        character: "Dina",
        profilePath: "/4SolFI9dwyPm6BXcb3PDcOYzSEl.jpg",
      },
      {
        id: 2569691,
        name: "Young Mazino",
        character: "Jesse",
        profilePath: "/bseVfwPNhDlToTIGs7FuKzd0uxi.jpg",
      },
    ],
    providers: [
      {
        id: 149,
        name: "Movistar Plus+ Ficción Total",
        logoPath: "/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 1825,
        name: "HBO Max Amazon Channel",
        logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg",
      },
      {
        id: 10,
        name: "Amazon Video",
        logoPath: "/qR6FKvnPBx2O37FDg8PNM7efwF3.jpg",
      },
    ],
  },
  "movie-155": {
    id: 155,
    title: "El caballero oscuro",
    overview:
      "Batman/Bruce Wayne regresa para continuar su guerra contra el crimen. Con la ayuda del teniente Jim Gordon y del Fiscal del Distrito Harvey Dent, Batman se propone destruir el crimen organizado en la ciudad de Gotham. El triunvirato demuestra su eficacia, pero, de repente, aparece Joker, un nuevo criminal que desencadena el caos y tiene aterrados a los ciudadanos.",
    posterPath: "/8QDQExnfNFOtabLDKqfDQuHDsIg.jpg",
    backdropPath: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
    mediaType: "movie",
    year: "2008",
    rating: 8.5,
    genres: ["Acción", "Crimen", "Suspense"],
    tagline: "Algunos hombres sólo quieren ver el mundo arder.",
    runtime: 152,
    status: "Released",
    director: "Christopher Nolan",
    cast: [
      {
        id: 3894,
        name: "Christian Bale",
        character: "Bruce Wayne",
        profilePath: "/7Pxez9J8fuPd2Mn9kex13YALrCQ.jpg",
      },
      {
        id: 1810,
        name: "Heath Ledger",
        character: "Joker",
        profilePath: "/AdWKVqyWpkYSfKE5Gb2qn8JzHni.jpg",
      },
      {
        id: 6383,
        name: "Aaron Eckhart",
        character: "Harvey Dent",
        profilePath: "/u5JjnRMr9zKEVvOP7k3F6gdcwT6.jpg",
      },
      {
        id: 3895,
        name: "Michael Caine",
        character: "Alfred",
        profilePath: "/bVZRMlpjTAO2pJK6v90buFgVbSW.jpg",
      },
      {
        id: 1579,
        name: "Maggie Gyllenhaal",
        character: "Rachel",
        profilePath: "/vsfkWdYWmA9CpzMHTJzrFxlDnEZ.jpg",
      },
      {
        id: 64,
        name: "Gary Oldman",
        character: "Gordon",
        profilePath: "/yhaSM5habNNI1Tf4ALRwRk3VvSZ.jpg",
      },
      {
        id: 192,
        name: "Morgan Freeman",
        character: "Lucius Fox",
        profilePath: "/905k0RFzH0Kd6gx8oSxRdnr6FL.jpg",
      },
      {
        id: 53651,
        name: "Monique Gabriela Curnen",
        character: "Ramirez",
        profilePath: "/lJgLQs7cfM49m8VzVviwxIByz76.jpg",
      },
    ],
    providers: [
      {
        id: 8,
        name: "Netflix",
        logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
      },
      {
        id: 119,
        name: "Amazon Prime Video",
        logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
      },
      {
        id: 149,
        name: "Movistar Plus+ Ficción Total",
        logoPath: "/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 1796,
        name: "Netflix Standard with Ads",
        logoPath: "/dpR8r13zWDeUR0QkzWidrdMxa56.jpg",
      },
      {
        id: 2100,
        name: "Amazon Prime Video with Ads",
        logoPath: "/8aBqoNeGGr0oSA85iopgNZUOTOc.jpg",
      },
    ],
  },
  "tv-94997": {
    id: 94997,
    title: "La casa del dragón",
    overview:
      "Basada en el libro 'Fuego y Sangre' de George R.R. Martin. La serie se centra en la casa Targaryen, trescientos años antes de los eventos vistos en 'Juego de Tronos'.",
    posterPath: "/8MaxftF69sEAAD5673vTjIl8yT3.jpg",
    backdropPath: "/577eXC8wFQT0eUrJcgznSiFPRmk.jpg",
    mediaType: "tv",
    year: "2022",
    rating: 8.4,
    genres: ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
    tagline: "Fuego y Sangre.",
    runtime: null,
    seasons: 3,
    status: "Returning Series",
    creators: ["George R.R. Martin", "Ryan J. Condal"],
    cast: [
      {
        id: 136532,
        name: "Matt Smith",
        character: "Prince Daemon Targaryen",
        profilePath: "/wxMdHj4UA6LgIU5MiA7CKySZeVU.jpg",
      },
      {
        id: 2121005,
        name: "Emma D'Arcy",
        character: "Princess Rhaenyra Targaryen",
        profilePath: "/9Zlmb7VmtVCxkLq5yqFFRRxCaED.jpg",
      },
      {
        id: 1173984,
        name: "Olivia Cooke",
        character: "Queen Alicent Hightower",
        profilePath: "/wf71ctooNlVmiT8dxx0QmRAzyiX.jpg",
      },
      {
        id: 1205278,
        name: "James Norton",
        character: "Lord Ormund Hightower",
        profilePath: "/3i9z9MkUCrlOGdMRw00j2vScxGC.jpg",
      },
      {
        id: 55412,
        name: "Steve Toussaint",
        character: "Lord Corlys 'The Sea Snake' Velaryon",
        profilePath: "/9rJafPDkQP8YuLy9iY5v19ZfMIW.jpg",
      },
      {
        id: 2583704,
        name: "Fabien Frankel",
        character: "Ser Criston Cole",
        profilePath: "/nXh1h7KbdeZc41ucwGhzp1cOMnd.jpg",
      },
      {
        id: 1584566,
        name: "Matthew Needham",
        character: "Lord Larys 'Clubfoot' Strong",
        profilePath: "/sZHT2xFtnBawU3DoaWZACSv15gX.jpg",
      },
      {
        id: 1457238,
        name: "Sonoya Mizuno",
        character: "Mysaria 'The White Worm'",
        profilePath: "/WVROOHuk6G6QgVe0pU8R2i1fsE.jpg",
      },
    ],
    providers: [
      {
        id: 149,
        name: "Movistar Plus+ Ficción Total",
        logoPath: "/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg",
      },
      {
        id: 1899,
        name: "HBO Max",
        logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
      },
      {
        id: 1825,
        name: "HBO Max Amazon Channel",
        logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg",
      },
    ],
  },
};

function toMediaItem(detail: MediaDetail): MediaItem {
  return {
    id: detail.id,
    title: detail.title,
    overview: detail.overview,
    posterPath: detail.posterPath,
    backdropPath: detail.backdropPath,
    mediaType: detail.mediaType,
    year: detail.year,
    rating: detail.rating,
    genres: detail.genres,
  };
}

export const fallbackCatalog: MediaItem[] = Object.values(demoDetails)
  .map(toMediaItem)
  .sort((a, b) => (a.id === 157336 ? -1 : b.id === 157336 ? 1 : 0));

export function getFallbackDetail(item: MediaItem): MediaDetail {
  const fallback = demoDetails[`${item.mediaType}-${item.id}`];
  if (fallback) {
    return {
      ...fallback,
      providersRegion: fallback.providers.length ? "MX" : null,
    };
  }
  return {
    ...item,
    cast: [],
    providers: [],
    providersRegion: null,
    tagline: undefined,
    runtime: null,
    seasons: null,
    status: null,
    director: null,
    creators: [],
  };
}
