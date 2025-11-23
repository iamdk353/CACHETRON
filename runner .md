# memecache server

- docker run -it --rm --network container:memcache_server alpine sh -c "apk add -q busybox-extras && telnet 127.0.0.1 11211"

# to list all in memcache

lru_crawler metadump all

# prefix set to memcache

get my-app-cache:1:1

## redis cli

docker exec -it redis_server redis-cli

---

**end points**:

- redis : redis://127.0.0.1:6379/
- memcache : 127.0.0.1:11211
