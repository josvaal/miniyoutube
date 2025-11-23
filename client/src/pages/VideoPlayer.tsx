import { useParams } from 'react-router';

export default function VideoPlayer() {
  const { id } = useParams();

  return (
    <div>
      <h1>Reproducir Video</h1>
      <p>ID del video: {id}</p>
    </div>
  );
}
