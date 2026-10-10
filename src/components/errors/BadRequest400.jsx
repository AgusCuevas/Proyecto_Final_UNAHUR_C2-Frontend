import ErrorPage from './ErrorPage.jsx';

export default function BadRequest400() {
  return (
    <ErrorPage
      code="400"
      title="La solicitud no es válida"
      message="Algo no salió como esperábamos. Revisá los datos e intentá nuevamente."
    />
  );
}
