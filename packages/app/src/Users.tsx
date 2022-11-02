import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Users = () => {
  const [count, setCount] = useState(0);
  return (
    <>
      <div>Users</div>
      count: {count} <button onClick={() => setCount(c => c + 1)}>add</button>
      <Link to='/'>home</Link>
    </>
  )
}
export default Users;