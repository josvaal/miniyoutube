import { useParams } from 'react-router';

export default function Channel() {
  const { userId } = useParams();

  return (
    <div>
      <h1>Canal</h1>
      <p>ID del canal: {userId}</p>
    </div>
  );
}
