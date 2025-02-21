import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > insertion > on conflict", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "sqlite", "better-sqlite3"], // since on conflict statement is only supported in postgres and sqlite >= 3.24.0
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform insertion correctly using onConflict", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO NOTHING`)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "About post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO UPDATE SET "title" = :title`)
                    .setParameter("title", post2.title)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "Again post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should perform insertion correctly using orIgnore", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orIgnore("date")
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "About post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should perform insertion correctly using orUpdate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orUpdate(["title"], ["date"])
                    .setParameter("title", post2.title)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "Again post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))
})
