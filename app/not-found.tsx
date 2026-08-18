import Link from "next/link";
export default function NotFound() { return <main className="page-shell status-page"><p className="eyebrow">404</p><h1>Dit werk hangt hier niet.</h1><p>De pagina bestaat niet meer of het kunstwerk is verplaatst.</p><Link className="button button-dark" href="/collectie">Bekijk de shop ↗</Link></main>; }
