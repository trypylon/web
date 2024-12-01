import React from 'react'
import Link from 'next/link'

const LogoButton: React.FC = () => {
  return (
    <Link href="/">
      <div className="relative z-20 flex items-center text-lg font-medium p-4 mb-4">
        <img
          src="/logo.png"
          className="mr-3 w-10 h-10"
          alt="Logo"
        />
        {`Hyrd.dev`}
      </div>
    </Link>
  )
}

export default LogoButton
