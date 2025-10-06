import Head from "next/head";

export default function Home(){
  return (
    <>
      <Head><title>Noliktava — sākums</title></Head>
      <main style={{minHeight:"100svh",display:"grid",placeItems:"center",fontFamily:"ui-sans-serif,system-ui"}}>
        <div style={{textAlign:"center"}}>
          <h1>Sveiks, noliktavas lietotāj!</h1>
          <p>Ja redzi šo lapu, autentifikācija strādā.</p>
          <p><a href="/api/logout">Izrakstīties</a></p>
        </div>
      </main>
    </>
  );
}
