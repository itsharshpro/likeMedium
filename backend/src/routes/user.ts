import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import {sign, decode, verify} from "hono/jwt"
import { signupInput } from '@itsharshpro/like-medium-common';

export const userRouter = new Hono<{
  Bindings:{
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}>();

userRouter.post('/signup', async (c) => {
  const body = await c.req.json();
  const {success} = signupInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message: "Invalid input"
    })
  };
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
          name: body.name
        }
      })
    
      const token = await sign({id: user.id},c.env.JWT_SECRET)
    
      return c.json({
        jwt: token
      });
    }catch(e){
      c.status(403);
      return c.json({
        error: "Error while signing up"
      });
    }
  })
  
  userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const body = await c.req.json();
  
    try{
      const user = await prisma.user.findUnique({
        where: {
          email: body.email,
          password: body.password
        }
      })
    
      if(!user){
        c.status(403);
        return c.json({
          error: "User not found"
        });
      }
    
      const jwt = await sign({id: user.id},c.env.JWT_SECRET);
      return c.json({
        jwt
      });
    }catch(e){
      c.status(403);
      return c.json({
        error: "Error while signing in"
      });
    }
  })
  
  userRouter.get('/getusers', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try{
      const users = await prisma.user.findMany();
      return c.json({
        users
      });
    }catch(e){
      c.status(403);
      return c.json({
        error: "Error while fetching all users"
      });
    }
  })