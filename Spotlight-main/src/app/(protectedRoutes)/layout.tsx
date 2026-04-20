import { onAuthenticateUser } from "@/actions/auth";
import Sidebar from "@/components/ReusableComponent/LayoutComponents/Sidebar";
import Header from "@/components/ReusableComponent/LayoutComponents/Header";
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
}

const Layout = async ({ children }: Props) => {
  const userExist = await onAuthenticateUser()

  if (!userExist.user) {
    redirect('/sign-in')
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* SIDEBAR */}
      <Sidebar/>
      <div className="flex flex-col w-full h-screen overflow-auto px-4 scrollbar-hide container mx-auto">
        <Header user={userExist.user}/>
        {children}
      </div>
    </div>
  )
}

export default Layout