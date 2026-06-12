import instaloader
L = instaloader.Instaloader()
profile = instaloader.Profile.from_username(L.context, 'adityakundli')
print('Followers:', profile.followers)
count = 0
for post in profile.get_posts():
    count += 1
    if count >= 15:
        break
print("Got", count, "posts")
