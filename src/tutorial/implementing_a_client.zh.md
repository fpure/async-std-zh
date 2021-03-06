## Implementing a client

现在让我们实现聊天的客户端。因为该协议是基于行（line-based）的，所以实现非常简单：

- 从 stdin 读取的行，应通过 socket 发送。
- 从 socket 读取的行，应回显到 stdout。

与服务器不同，客户端仅需要有限的并发性，因为它仅与单个用户进行交互。因此，在这种情况下，异步不会带来很多性能优势。

但是，异步对于管理并发仍然很有用！具体来说，客户应*同时*从 stdin 和 socket 中读取(信息)。使用线程对此进行编程非常麻烦，尤其是要干净关机时。使用异步，我们可以只用`select!`宏就可以了。

```rust,edition2018
# extern crate async_std;
# extern crate futures;
use async_std::{
    io::{stdin, BufReader},
    net::{TcpStream, ToSocketAddrs},
    prelude::*,
    task,
};
use futures::{select, FutureExt};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

// main
fn run() -> Result<()> {
    task::block_on(try_run("127.0.0.1:8080"))
}

async fn try_run(addr: impl ToSocketAddrs) -> Result<()> {
    let stream = TcpStream::connect(addr).await?;
    let (reader, mut writer) = (&stream, &stream); // 1
    let mut lines_from_server = BufReader::new(reader).lines().fuse(); // 2
    let mut lines_from_stdin = BufReader::new(stdin()).lines().fuse(); // 2
    loop {
        select! { // 3
            line = lines_from_server.next().fuse() => match line {
                Some(line) => {
                    let line = line?;
                    println!("{}", line);
                },
                None => break,
            },
            line = lines_from_stdin.next().fuse() => match line {
                Some(line) => {
                    let line = line?;
                    writer.write_all(line.as_bytes()).await?;
                    writer.write_all(b"\n").await?;
                }
                None => break,
            }
        }
    }
    Ok(())
}
```

1.  在这里，我们将`TcpStream`分为了，一半 read 和一半 write ：这里的`impl AsyncRead for &'_ TcpStream`，就像 std 中的那个一样。
2.  我们为 socket 和 stdin 创建了行的数据流(a stream of lines)。
3.  在 main select 循环中，我们打印从服务器接收的 lines，并发送从控制台读取到的 lines。
