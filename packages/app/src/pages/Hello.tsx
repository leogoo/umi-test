import React from 'react';
import { Link } from 'react-router-dom';

const Hello = () => {
  return (
    <>
      <div>Hello</div>
      <Link to='/users'>users</Link>
    </>
  )
}
export default Hello;