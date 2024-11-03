import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from '@prisma/client/edge';
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string;
    }
}>();

blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header("Authorization") || "";
    try{
        const user = await verify(authHeader, c.env.JWT_SECRET);
    if(user){
        c.set("userId", (user as { id: string }).id);
        await next();
    }else{
        c.status(403);
        return c.json({
            message: "Unauthorized"
        })
    }
    }catch(e){
        c.status(403);
        return c.json({
            message: "You are not logged in"
    })}
})

blogRouter.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const body = await c.req.json();
    const userId = c.get("userId");

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: Number(userId)
        }
    })

    return c.json({
        id: blog.id
    })
  })
  
blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const body = await c.req.json();

    const blog = await prisma.blog.update({
        where: {
            id: Number(body.id)
        },
        data: {
            title: body.title,
            content: body.content
        }
    })

    return c.json({
        id: blog.id
    })
})

// one should add pagenation here and not return all the blogs at once
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogs = await prisma.blog.findMany();

    return c.json({
        blogs
    })
})

// one should not use body to pass the id, instead use query params
//infact in a get requent one should not use body at all
blogRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const id = c.req.param("id");

    try{
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            }
        })
    
        return c.json({
            blog
        })
    }catch(e){
        c.status(411);
        return c.json({
            error: "error while fetching blog post"
        })
    }
})