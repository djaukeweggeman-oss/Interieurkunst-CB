"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="page-shell status-page"><p className="eyebrow">Er ging iets mis</p><h1>Even opnieuw proberen.</h1><p>De pagina kon niet goed worden geladen. Er is niets besteld of afgeschreven.</p><button className="button button-dark" onClick={reset} type="button">Opnieuw proberen</button></main>; }

