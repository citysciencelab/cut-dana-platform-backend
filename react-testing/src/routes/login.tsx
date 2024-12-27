import { createFileRoute, redirect, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const search = useSearch({
    from: "/login"
  });
  
  const clickLogin = () => {
    window.location.href = "http://localhost:8000/auth/login";
  }

  useEffect(() => {
    const newSearch = search as any;
    
    if (newSearch.code) {
      
    }
  }, [search]);
  
  return <div>Hello "/login"! <button onClick={clickLogin}>Login</button></div>
}
