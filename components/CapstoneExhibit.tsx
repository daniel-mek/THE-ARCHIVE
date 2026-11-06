import ProjectUI from './ProjectUI';
const repository = 'https://github.com/IT490-104SP26/Capstone-Group-03';
export default function CapstoneExhibit({onReturn}:{onReturn:()=>void}) {
  return <>
    <p className="eyebrow">EXHIBIT 002 / DISTRIBUTED SYSTEMS · TEAM CAPSTONE</p>
    <h2 id="panel-title">THIS IS MUSIC.</h2>
    <p className="large-copy">Discover music. Explore the system behind it.</p>
    <ProjectUI project="music"/>
    <p>A team capstone for music discovery and personal collections. The supplied source includes account registration and login, song and album search, liked-song request flows, and interfaces for playlists, listening history, and profiles.</p>
    <section className="case-section"><h3>01 / The experience</h3><p>Search for music through the iTunes catalog, explore results, and organize a personal collection. Playlist and profile interfaces use browser local storage; their presence is not a claim of fully synchronized server-side storage.</p></section>
    <section className="case-section"><h3>02 / Behind a search</h3><ol className="architecture-flow"><li><strong>Browser → Python frontend</strong><span>The HTTP server receives the search request.</span></li><li><strong>Frontend → RabbitMQ</strong><span>A request is published with a correlation ID and reply queue.</span></li><li><strong>Worker → iTunes catalog</strong><span>The backend search worker requests song and album results.</span></li><li><strong>Worker pipeline → Frontend</strong><span>Queue messages carry the results back through the response flow.</span></li></ol></section>
    <section className="case-section"><h3>03 / Separate services, shared state</h3><p>The repository separates frontend, backend workers, database workers, and messaging code. Its setup guide describes four Ubuntu virtual machines. The SQL schema models users, songs, playlists, likes, listening history, chats, and shared links. A schema defines the data model; it does not establish that every corresponding feature is complete.</p></section>
    <section className="case-section"><h3>04 / Team work & contribution</h3><p>Presented as a Group 03 team project. Daniel’s individual responsibilities and implementation contributions are awaiting confirmation.</p></section>
    <div className="notice">Based on source review of the supplied archive (snapshot 86bfcb9). The distributed application was not run during this review; deployment status, performance, and user outcomes are unverified.</div>
    <a className="primary" href={repository} target="_blank" rel="noopener noreferrer">Explore the source on GitHub ↗</a>
    <p className="source-note">Source references: frontend/app.py, frontend/fe_producer.py, Backend-FE/search_worker.py, database/init_db.sql, and the playlist and profile templates. The setup README references PHP/Apache, while the supplied application implementation uses Python.</p>
    <button className="text-button" onClick={onReturn}>← Return to the workbench</button>
  </>;
}
