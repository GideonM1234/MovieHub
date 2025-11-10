import React, { useState, useEffect } from "react";
import Search from "./components/Search";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { updateSearchCount, TrendingMovies } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
	method: "GET",
	headers: {
		accept: "application/json",
		Authorization: `Bearer ${API_KEY}`,
	},
};

const App = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [movieList, setMovieList] = useState([]);
	const [isloading, setisLoading] = useState(false);
	const [errorMessage, seterrorMessage] = useState("");
	const [deBounceSearchTerm, setDeBounceSearchTerm] = useState();
	const [trendingMovies, setTrendingMovies] = useState([]);

	// Debounce the search term input to limit API calls
	useDebounce(
		() => {
			setDeBounceSearchTerm(searchTerm);
		},
		500,
		[searchTerm]
	);

	const fetchMovies = async (query = "") => {
		setisLoading(true);
		seterrorMessage("");

		try {
			const endpoint = query
				? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
						query
				  )}`
				: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
			const response = await fetch(endpoint, API_OPTIONS);

			// if there is not response it should throw an error
			if (!response.ok) {
				throw new Error("Failed to fetch movies");
			}

			const data = await response.json();

			if (!data.results) {
				seterrorMessage("No movies found");
				setMovieList([]);
				return;
			}

			setMovieList(data.results || []);

			// Update search count in Appwrite database
			if (query && data.results.length > 0) {
				await updateSearchCount(query, data.results[0]);
			}
		} catch (error) {
			console.error("Error fetching movies:", error);
			seterrorMessage("Failed to fetch movies. Please try again later.");
		} finally {
			setisLoading(false);
		}
	};

	const fetchTrendingMovies = async () => {
		try {
			// Fetch trending movies from Appwrite database
			const trending = await TrendingMovies();
			// Update state with trending movies
			setTrendingMovies(trending);
		} catch (error) {
			console.error("Error fetching trending movies:", error);
		}
	};

	useEffect(() => {
		fetchMovies(deBounceSearchTerm);
	}, [deBounceSearchTerm]);

	useEffect(() => {
		fetchTrendingMovies();
	}, []);

	return (
		<main>
			<div className="pattern" />

			<div className="wrapper">
				<header>
					<img src="./hero.png" alt="Hero Banner" />
					<h1>
						Find <span className="text-gradient">Movies</span>
						You'll Enjoy Without the Hassle
					</h1>

					<Search
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
					/>
				</header>

				{trendingMovies.length > 0 && (
					<section className="trending">
						<h2>Trending Movies</h2>

						<ul>
							{trendingMovies.map((movie, index) => (
								<li key={movie.$id}>
									<p>{index + 1}</p>
									<img
										src={movie.poster_url}
										alt={movie.title}
									/>
								</li>
							))}
						</ul>
					</section>
				)}

				<section className="all-movies">
					<h2>Popular</h2>
					{isloading ? (
						<div className="flex justify-center  item-center">
							<span
								className="w-9 h-9 border-4 text-white border-white border-t-transparent
				            	 rounded-full animate-spin"
							></span>
						</div>
					) : errorMessage ? (
						<p className="text-red-500"> {errorMessage}</p>
					) : (
						<ul>
							{movieList.map((movie) => (
								<MovieCard key={movie.id} movie={movie} />
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
};

export default App;
