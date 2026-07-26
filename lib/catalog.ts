import { MediaItem } from "./types";

export const imageUrl = (path: string, size: "poster" | "backdrop" = "poster") =>
  path.startsWith("http") ? path : `https://image.tmdb.org/t/p/${size === "poster" ? "w500" : "original"}${path}`;

export const featured: MediaItem = {
  id: 157336,
  title: "Interstellar",
  overview: "Un grupo de exploradores viaja más allá de nuestra galaxia para descubrir si la humanidad tiene futuro entre las estrellas.",
  posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
  mediaType: "movie",
  year: "2014",
  rating: 8.5,
  genres: ["Ciencia ficción", "Drama"],
};

export const fallbackCatalog: MediaItem[] = [
  featured,
  { id: 1399, title: "Game of Thrones", overview: "Nueve familias nobles luchan por el control de las tierras de Poniente.", posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", backdropPath: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg", mediaType: "tv", year: "2011", rating: 8.4, genres: ["Drama", "Fantasía"] },
  { id: 66732, title: "Stranger Things", overview: "Un grupo de amigos descubre fuerzas sobrenaturales y experimentos secretos.", posterPath: "/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg", backdropPath: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", mediaType: "tv", year: "2016", rating: 8.6, genres: ["Drama", "Misterio"] },
  { id: 693134, title: "Dune: Parte dos", overview: "Paul Atreides se une a Chani y los Fremen mientras busca venganza.", posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", backdropPath: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", mediaType: "movie", year: "2024", rating: 8.2, genres: ["Ciencia ficción", "Aventura"] },
  { id: 100088, title: "The Last of Us", overview: "Joel y Ellie atraviesan unos Estados Unidos devastados.", posterPath: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", backdropPath: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", mediaType: "tv", year: "2023", rating: 8.6, genres: ["Drama"] },
  { id: 155, title: "El caballero oscuro", overview: "Batman se enfrenta a un criminal que siembra el caos en Gotham.", posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdropPath: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg", mediaType: "movie", year: "2008", rating: 8.5, genres: ["Acción", "Crimen"] },
  { id: 94997, title: "La casa del dragón", overview: "La historia de la casa Targaryen doscientos años antes de Game of Thrones.", posterPath: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", backdropPath: "/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg", mediaType: "tv", year: "2022", rating: 8.3, genres: ["Drama", "Fantasía"] },
];
